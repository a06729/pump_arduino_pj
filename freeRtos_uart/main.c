#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <stdlib.h>
#include <string.h> // memset_P 추가
#include "uart.h"
#include "protocol.h"

// FreeRTOS 헤더 파일
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"

// Task 간 통신을 위한 큐 핸들
static QueueHandle_t xUartQueue = NULL;

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