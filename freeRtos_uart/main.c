#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <stdlib.h>
#include <string.h> // memset_P 추가
#include "uart.h"

// FreeRTOS 헤더 파일
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"

// --- 프로토콜 정의 ---
#define MY_SLAVE_ID             0x01  // 이 장치의 Slave ID
#define PROTOCOL_BUFFER_SIZE    16    // 수신 패킷 버퍼 크기 ('$'...'\n' 포함)

// PDF 프레임 인덱스 정의 [cite: 29, 31]
#define FRAME_IDX_START         0
#define FRAME_IDX_ID            1
#define FRAME_IDX_CMD           2
#define FRAME_IDX_ADDR          3
#define FRAME_IDX_W_DATA        4 // 쓰기 명령(W)일 경우 데이터 위치
#define FRAME_IDX_W_CHECKSUM    5
#define FRAME_IDX_W_END         6

#define FRAME_IDX_R_DATA        4 // 읽기 응답(R)일 경우 데이터 위치
#define FRAME_IDX_R_CHECKSUM    5
#define FRAME_IDX_R_END         6
// ---------------------

//write 명령
// $   SlaveId  W    주소  쓰기값 checkSum값 \n(아스키코드값)
//0x24   0x01  0x57  0x05  0xAA     0x07     0x0A
// $   SlaveId  R    주소  checkSum값  \n
//0x24  0x01   0x52  0x05  0x58      0x0A



// Task 간 통신을 위한 큐 핸들
static QueueHandle_t xUartQueue = NULL;

// 가상의 데이터 저장소 (Address 0x00 ~ 0x0F)
static uint8_t g_device_registers[16] = {0};


/**
 * @brief Rx Task: 수신 링 버퍼 -> FreeRTOS 큐 (원본 코드와 동일)
 * ISR의 링 버퍼에서 바이트를 가져와 처리 태스크용 큐로 전송합니다.
 */
void vRxTask(void *pvParameters) {
    uint8_t received_char;
    
    while (1) {
        // uart_rx()는 내부적으로 vTaskDelay(1)을 포함하여
        // 데이터가 없을 때 CPU를 양보합니다.
        received_char = uart_rx(); 
        
        // 데이터를 FreeRTOS 큐로 전송 (최대 10ms 대기)
        if (xQueueSend(xUartQueue, &received_char, pdMS_TO_TICKS(10)) != pdPASS) {
            // 큐 오버런 발생: vProtocolTask가 너무 느림
        }
    }
}


/**
 * @brief PDF 프로토콜에 정의된 체크섬을 계산합니다. 
 * @param buffer '$'를 제외한 패킷 데이터 (ID부터 Checksum 앞까지)
 * @param length 체크섬 계산에 포함될 바이트 수
 * @return 계산된 체크섬
 */
static uint8_t calculate_checksum(uint8_t *buffer, uint8_t length) {
    uint8_t sum = 0;
    for (uint8_t i = 0; i < length; i++) {
        sum += buffer[i];
    }
    return sum;
}

/**
 * @brief Master에게 보낼 응답 프레임을 생성하고 전송합니다. 
 * @param slave_id 응답하는 Slave ID
 * @param cmd 'W' 또는 'R'
 * @param addr 처리한 주소
 * @param data 'R' 명령의 경우 읽은 값, 'W' 명령의 경우 쓴 값
 */
static void send_response(uint8_t slave_id, uint8_t cmd, uint8_t addr, uint8_t data) {
    uint8_t response[7]; // 응답 프레임 (7바이트 고정)
    uint8_t checksum;

    response[0] = '$';
    response[1] = slave_id;
    response[2] = cmd;
    response[3] = addr;
    response[4] = data; // R 응답 시 읽은 데이터 
    
    // 체크섬 계산: ID부터 데이터까지의 합 
    checksum = calculate_checksum(&response[1], 4); 
    
    response[5] = checksum;
    response[6] = '\n';

    // uart_tx 함수는 RS-485 송신 모드를 자동으로 처리합니다.
    for (uint8_t i = 0; i < 7; i++) {
        uart_tx(response[i]);
    }
}

/**
 * @brief 수신된 패킷을 파싱하고 처리합니다. (Slave 로직) 
 * @param buffer 수신된 전체 패킷 ('$'...'\n' 포함)
 * @param length 패킷의 전체 길이
 */
static void process_packet(uint8_t *buffer, uint8_t length) {
    // 1. 최소 길이 확인 (W: 7바이트, R: 6바이트)
    if (length < 6) return; // 너무 짧음

    // 2. Slave ID 확인
    uint8_t slave_id = buffer[FRAME_IDX_ID];
    if (slave_id != MY_SLAVE_ID) {
        return; // 이 장치를 위한 패킷이 아님
    }

    // 3. 체크섬 확인 
    uint8_t cmd = buffer[FRAME_IDX_CMD];
    uint8_t addr = buffer[FRAME_IDX_ADDR];
    uint8_t received_checksum;
    uint8_t calculated_checksum;
    uint8_t data_len_for_checksum;

    if (cmd == 'W') {
        if (length != 7) return; // 'W' 명령은 7바이트여야 함 
        received_checksum = buffer[FRAME_IDX_W_CHECKSUM];
        data_len_for_checksum = 4; // ID, Cmd, Addr, Data
    } else if (cmd == 'R') {
        if (length != 6) return; // 'R' 명령은 6바이트여야 함  (Data 필드 없음)
        received_checksum = buffer[length - 2]; // Checksum은 \n 바로 앞
        data_len_for_checksum = 3; // ID, Cmd, Addr
    } else {
        return; // 알 수 없는 명령
    }
    
    calculated_checksum = calculate_checksum(&buffer[FRAME_IDX_ID], data_len_for_checksum);

    if (received_checksum != calculated_checksum) {
        return; // 체크섬 오류
    }

    // 4. 유효성 검사 통과 -> 명령 처리
    uint8_t data;
    if (cmd == 'W') {
        data = buffer[FRAME_IDX_W_DATA];
        if (addr < 16) { // 가상 레지스터 범위 확인
            g_device_registers[addr] = data;
        }
        // 'W' 명령에 대한 응답 
        send_response(slave_id, cmd, addr, data); 
        
    } else if (cmd == 'R') {
        data = 0;
        if (addr < 16) { // 가상 레지스터 범위 확인
            data = g_device_registers[addr];
        }
        // 'R' 명령에 대한 응답 
        send_response(slave_id, cmd, addr, data);
    }
}

/**
 * @brief Protocol Task: 큐 -> 패킷 조립 -> 패킷 처리
 * vRxTask가 큐에 넣은 바이트들을 수신하여 프로토콜 패킷을 조립하고 처리합니다.
 */
void vProtocolTask(void *pvParameters) {
    uint8_t received_char;
    uint8_t packet_buffer[PROTOCOL_BUFFER_SIZE];
    uint8_t packet_index = 0;
    
    // 수신 상태 (IDLE: '$' 대기, RECEIVING: '\n' 대기)
    enum { STATE_IDLE, STATE_RECEIVING } state = STATE_IDLE;

    while (1) {
        // 1. FreeRTOS 큐에서 데이터 수신 (무기한 대기)
        if (xQueueReceive(xUartQueue, &received_char, portMAX_DELAY) == pdPASS) {
            
            if (state == STATE_IDLE) {
                // '$' (시작 문자)를 기다림
                if (received_char == '$') {
                    packet_index = 0;
                    packet_buffer[packet_index++] = received_char;
                    state = STATE_RECEIVING;
                }
            } 
            else if (state == STATE_RECEIVING) {
                // 패킷 조립
                if (packet_index < PROTOCOL_BUFFER_SIZE) {
                    packet_buffer[packet_index++] = received_char;
                } else {
                    // 버퍼 오버플로우. 패킷 무시하고 리셋
                    state = STATE_IDLE;
                    continue;
                }

                // '\n' (종료 문자) 수신 시
                if (received_char == '\n') {
                    // Master의 요청 처리 
                    process_packet(packet_buffer, packet_index);
                    // 다음 패킷을 위해 IDLE 상태로 복귀
                    state = STATE_IDLE;
                }
            }
        }
    }
}


int main(void) {
    // UART 드라이버 초기화
    uart_init(BAUD);
    
    // 큐 생성: 64개의 8비트(uint8_t) 요소를 저장
    // 수신 버퍼링을 위해 넉넉하게 설정
    xUartQueue = xQueueCreate(64, sizeof(uint8_t));

    if (xUartQueue != NULL) {
        // Rx Task 생성 (높은 우선순위: 수신 데이터를 빠르게 링 버퍼에서 큐로 이동)
        xTaskCreate(
            vRxTask,
            "RxTask",
            configMINIMAL_STACK_SIZE,
            NULL,
            tskIDLE_PRIORITY + 2,
            NULL
        );

        // Protocol Task 생성 (상대적으로 낮은 우선순위: 패킷 처리)
        xTaskCreate(
            vProtocolTask,
            "ProtoTask", // vTxTask -> vProtocolTask
            configMINIMAL_STACK_SIZE + 100, // 패킷 처리 로직을 위해 스택 증가
            NULL,
            tskIDLE_PRIORITY + 1,
            NULL
        );
        
        // FreeRTOS 스케줄러 시작
        vTaskStartScheduler();
    }

    // 스케줄러가 시작되면 이 부분은 실행되지 않음
    while (1) { }
    
    return 0;
}