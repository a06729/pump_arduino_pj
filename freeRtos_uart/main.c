#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include <stdlib.h>
#include <ctype.h>
#include "uart.h"

// FreeRTOS 헤더 파일 (경로는 프로젝트 설정에 맞게 조정하세요)
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"

// Task 간 통신을 위한 큐 핸들
static QueueHandle_t xUartQueue = NULL;


// Rx Task: 수신 링 버퍼 -> FreeRTOS 큐
void vRxTask(void *pvParameters) {
	uint8_t received_char;
		
	while (1) {
		// 1. 저수준 RX 링 버퍼에서 데이터 확인
		if (uart_is_available()) {
			received_char = uart_rx(); // Non-blocking (vTaskDelay 있음)
			
			// 2. 데이터가 있다면, FreeRTOS 큐로 전송 (대기 시간 0)
			if (xQueueSend(xUartQueue, &received_char, 0) != pdPASS) {
				// 큐 오버런 발생: 데이터가 처리되는 속도보다 수신 속도가 빠름
			}
		}
		
		// 너무 빠른 폴링을 방지하고 CPU 자원을 다른 Task에 양보 (1 틱 대기)
		vTaskDelay(pdMS_TO_TICKS(1));
	}
}

// Tx Task: FreeRTOS 큐 -> 데이터 처리 -> 송신 링 버퍼
void vTxTask(void *pvParameters) {
	uint8_t char_to_process;
	
	while (1) {
		// 1. FreeRTOS 큐에서 데이터 수신 (무기한 대기)
		// Task는 데이터가 도착할 때까지 Block 상태 유지
		if (xQueueReceive(xUartQueue, &char_to_process, portMAX_DELAY) == pdPASS) {
			// 3. 처리된 데이터를 송신
			uart_tx(char_to_process);
		}
	}
}


int main(void) {
	// Baud rate 인자는 현재 사용하지 않지만, 함수의 인자 목록을 유지했습니다.
	uart_init(BAUD);
	
	// 큐 생성: 32개의 8비트(uint8_t) 요소를 저장
	xUartQueue = xQueueCreate(32, sizeof(uint8_t));

	if (xUartQueue != NULL) {
		// Rx Task 생성 (높은 우선순위: 수신 데이터를 빠르게 링 버퍼에서 큐로 이동)
		xTaskCreate(
		vRxTask,
		"RxTask",
		configMINIMAL_STACK_SIZE + 50,
		NULL,
		tskIDLE_PRIORITY + 2,
		NULL
		);

		// Tx Task 생성 (상대적으로 낮은 우선순위: 데이터 처리)
		xTaskCreate(
		vTxTask,
		"TxTask",
		configMINIMAL_STACK_SIZE + 50,
		NULL,
		tskIDLE_PRIORITY + 1,
		NULL
		);
		
		// FreeRTOS 스케줄러 시작 (이 시점에서 전역 인터럽트가 활성화됨)
		vTaskStartScheduler();
	}

	// 스케줄러가 시작되면 이 부분은 실행되지 않음
	while (1) {
		// 스케줄러 시작 실패 시
	}
	
	return 0;
}