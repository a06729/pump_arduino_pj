#include <string.h> // memset
#include "modbus.h"
#include "uart.h" // uart_tx() 사용을 위해

// main.c에 정의된 큐 핸들 (extern으로 참조)
extern QueueHandle_t xUartQueue;

// Modbus 데이터 저장소 (실제 메모리 할당)
uint16_t g_holding_registers[HOLDING_REGISTERS_COUNT];

// Modbus CRC-16 계산 함수
static uint16_t modbus_crc16(const uint8_t *buffer, uint16_t len) {
    uint16_t crc = 0xFFFF;
    for (uint16_t pos = 0; pos < len; pos++) {
        crc ^= (uint16_t)buffer[pos];
        for (int i = 8; i != 0; i--) {
            if ((crc & 0x0001) != 0) {
                crc >>= 1;
                crc ^= 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    // Low-High byte order
    return crc;
}

// Modbus 응답 프레임 전송
static void modbus_send_response(uint8_t *frame, uint8_t len) {
    // RS-485 드라이버(uart.c)가 방향 전환을 자동으로 처리합니다.
    for (uint8_t i = 0; i < len; i++) {
        uart_tx(frame[i]);
    }
}

// Modbus 예외 응답 전송
static void modbus_send_exception(uint8_t function_code, uint8_t exception_code) {
    uint8_t response_frame[5];
    response_frame[0] = MODBUS_SLAVE_ID;
    response_frame[1] = function_code | 0x80; // 에러 플래그
    response_frame[2] = exception_code;
    
    uint16_t crc = modbus_crc16(response_frame, 3);
    response_frame[3] = (uint8_t)(crc & 0xFF);
    response_frame[4] = (uint8_t)(crc >> 8);
    
    modbus_send_response(response_frame, 5);
}

// 수신된 Modbus 프레임 처리
static void modbus_process_frame(uint8_t *frame, uint8_t len) {
    // 1. 최소 프레임 크기 확인 (ID + FC + CRC_L + CRC_H = 4바이트)
    if (len < 4) {
        return; // 너무 짧은 프레임
    }

    // 2. 슬레이브 ID 확인 (브로드캐스트(0)가 아니면서 ID가 일치하지 않으면 무시)
    if (frame[0] != MODBUS_SLAVE_ID && frame[0] != 0) {
        return;
    }

    // 3. CRC 확인
    uint16_t crc_received = (frame[len - 1] << 8) | frame[len - 2];
    uint16_t crc_calculated = modbus_crc16(frame, len - 2);

    if (crc_received != crc_calculated) {
        return; // CRC 오류
    }

    uint8_t function_code = frame[1];
    uint16_t start_addr = ((uint16_t)frame[2] << 8) | frame[3];
    uint16_t num_regs_or_value = ((uint16_t)frame[4] << 8) | frame[5];

    // 브로드캐스트(ID=0)인 경우 응답을 보내지 않음
    if (frame[0] == 0) {
        // TODO: 브로드캐스트 쓰기 명령 처리 (예: FC 0x06, 0x10)
        return;
    }

    // 4. 기능 코드(FC)에 따라 처리
    switch (function_code) {
        
        // FC 0x03: Read Holding Registers
        case 0x03: {
            if ((start_addr + num_regs_or_value) > HOLDING_REGISTERS_COUNT) {
                modbus_send_exception(function_code, MODBUS_EXCEPTION_ILLEGAL_DATA_ADDRESS);
                break;
            }
            
            uint8_t byte_count = num_regs_or_value * 2;
            uint8_t response_frame[MODBUS_BUFFER_SIZE];
            response_frame[0] = MODBUS_SLAVE_ID;
            response_frame[1] = function_code;
            response_frame[2] = byte_count;
            
            uint8_t resp_idx = 3;
            for (uint16_t i = 0; i < num_regs_or_value; i++) {
                uint16_t reg_val = g_holding_registers[start_addr + i];
                response_frame[resp_idx++] = (uint8_t)(reg_val >> 8); // High byte
                response_frame[resp_idx++] = (uint8_t)(reg_val & 0xFF); // Low byte
            }
            
            uint16_t crc = modbus_crc16(response_frame, resp_idx);
            response_frame[resp_idx++] = (uint8_t)(crc & 0xFF);
            response_frame[resp_idx++] = (uint8_t)(crc >> 8);
            
            modbus_send_response(response_frame, resp_idx);
            break;
        }

        // FC 0x06: Write Single Register
        case 0x06: {
            if (start_addr >= HOLDING_REGISTERS_COUNT) {
                modbus_send_exception(function_code, MODBUS_EXCEPTION_ILLEGAL_DATA_ADDRESS);
                break;
            }
            
            // 데이터 쓰기
            g_holding_registers[start_addr] = num_regs_or_value;
            
            // 응답 (수신한 프레임을 그대로 에코)
            modbus_send_response(frame, len);
            break;
        }

        // TODO: FC 0x10 (Write Multiple Registers) 등 다른 기능 코드 구현
        
        default:
            modbus_send_exception(function_code, MODBUS_EXCEPTION_ILLEGAL_FUNCTION);
            break;
    }
}


/**
 * @brief Modbus 슬레이브 태스크
 */
void vModbusTask(void *pvParameters) {
    static uint8_t modbus_frame[MODBUS_BUFFER_SIZE];
    static uint8_t frame_index = 0;
    uint8_t received_char;
    
    // 큐 타임아웃 설정 (Modbus RTU 프레임 갭 감지용)
    const TickType_t xFrameTimeout = pdMS_TO_TICKS(MODBUS_FRAME_TIMEOUT_MS);

    while (1) {
        // 1. 큐에서 바이트 수신 (xFrameTimeout 동안 대기)
        if (xQueueReceive(xUartQueue, &received_char, xFrameTimeout) == pdPASS) {
            // 1-1. 바이트 수신 성공
            if (frame_index < MODBUS_BUFFER_SIZE) {
                modbus_frame[frame_index++] = received_char;
            } else {
                // 프레임 버퍼 오버플로우. 다음 프레임을 위해 리셋.
                frame_index = 0;
            }
        } else {
            // 1-2. 큐 수신 타임아웃 (== 3.5 문자 시간 경과 == 프레임 종료)
            if (frame_index > 0) {
                // 2. 수신된 프레임이 있으면 처리
                modbus_process_frame(modbus_frame, frame_index);
                
                // 3. 다음 프레임을 위해 인덱스 리셋
                frame_index = 0;
            }
        }
    }
}

/**
 * @brief Modbus 레지스터 초기화
 */
void modbus_init(void) {
    // 홀딩 레지스터를 0으로 초기화 (또는 기본값 설정)
    memset(g_holding_registers, 0, sizeof(g_holding_registers));
    
    // 예제: 0번 레지스터에 0xAAAA 값 설정
    g_holding_registers[0] = 0xAAAA;
}