#include <avr/interrupt.h>
#include "uart.h"
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"


// 링 버퍼 변수 (사용자 정의 방식 그대로 유지)
volatile uint8_t tx_buffer[USART_TX_BUFFER_SIZE];
volatile uint8_t tx_head = 0;
volatile uint8_t tx_tail = 0;
volatile uint8_t rx_buffer[USART_RX_BUFFER_SIZE];
volatile uint8_t rx_head = 0;
volatile uint8_t rx_tail = 0;

// 수신 완료 인터럽트 핸들러 (RX Complete)
ISR(USART_RX_vect) {
	uint8_t data = UDR0;
	uint8_t next_head = (rx_head + 1) % USART_RX_BUFFER_SIZE;

	// 버퍼 오버플로우 방지
	if (next_head == rx_tail) {
		return;
	}

	rx_buffer[rx_head] = data;
	rx_head = next_head;
}


// 송신 데이터 레지스터 비어 있음 인터럽트 핸들러 (Data Register Empty)
ISR(USART_UDRE_vect) {
	if (tx_head == tx_tail) {
		// 송신할 데이터가 없으면 UDRE 인터럽트만 비활성화합니다.
		UCSR0B &= ~(1 << UDRIE0);
		// 방향 전환은 TX Complete ISR에서 처리됩니다.
		return;
	}

	// 다음 데이터 송신
	UDR0 = tx_buffer[tx_tail];
	tx_tail = (tx_tail + 1) % USART_TX_BUFFER_SIZE;
}

// 전송 완료 인터럽트 핸들러 (TX Complete) - RS-485 수신 모드 전환용
ISR(USART_TX_vect) {
	// 마지막 데이터 전송 완료 후 호출됨.
	// 링 버퍼가 비어 있는지 (UDRE ISR에서 마지막 데이터가 UDR0에 써진 후) 확인
	if (tx_head == tx_tail) {
		// 송신 버퍼가 완전히 비었으므로, RS-485를 수신 모드로 전환합니다.
		// 수신 모드 전환 (DE=LOW, ~RE=LOW)
		RS485_PORT &= ~((1 << RS485_DE_PIN) | (1 << RS485_RE_PIN));
	}

}


// -----------------------------------------------------------
// 4. UART/RS-485 드라이버 구현
// -----------------------------------------------------------

void uart_init(uint32_t baud) {
	// 보율 설정
	UBRR0H = (uint8_t)(UBRR_VALUE >> 8);
	UBRR0L = (uint8_t)UBRR_VALUE;
	
	// RX/TX, RXCIE0 활성화
	// TXCIE0 (TX Complete Interrupt Enable) 활성화 추가
	UCSR0B = (1 << RXEN0) | (1 << TXEN0) | (1 << RXCIE0) | (1 << TXCIE0);
	
	// 8N1 설정
	UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
	
	// RS-485 핀 초기화 및 출력 설정
	RS485_DDR |= (1 << RS485_DE_PIN) | (1 << RS485_RE_PIN);
	
	// 기본 상태: 수신 모드 (DE=LOW, ~RE=LOW)
	RS485_PORT &= ~((1 << RS485_DE_PIN) | (1 << RS485_RE_PIN));

	// TXC 플래그를 미리 클리어합니다 (1을 써서 클리어).
	UCSR0A |= (1 << TXC0);
}

void uart_tx(uint8_t data) {
	uint8_t next_head;
	
	// 1. 송신 모드 활성화 (데이터를 버퍼에 넣기 전에 즉시 TX 모드로 전환)
	// (DE=HIGH, ~RE=HIGH)
	RS485_PORT |= (1 << RS485_DE_PIN) | (1 << RS485_RE_PIN);
	
	// 2. 링 버퍼에 쓰기 (Non-blocking: FreeRTOS Task를 Block)
	while (1) {
		next_head = (tx_head + 1) % USART_TX_BUFFER_SIZE;
		
		if (next_head != tx_tail) {
			break; // 버퍼에 공간이 있다면 루프 탈출
		}
		
		// 버퍼가 가득 찼다면, Task를 잠시 Block하여 CPU 양보
		// 1틱(일반적으로 1ms) 대기하며 다른 Task가 UDRE ISR을 처리하도록 기회 제공
		vTaskDelay(pdMS_TO_TICKS(1));
	}

	tx_buffer[tx_head] = data;
	tx_head = next_head;
	
	// 3. UDRE 인터럽트 활성화 (송신 시작)
	UCSR0B |= (1 << UDRIE0);
}

uint8_t uart_rx() {
	// RX 버퍼가 비어 있다면, Task를 Block하여 데이터가 올 때까지 대기
	while (rx_head == rx_tail) {
		// FreeRTOS 환경이므로 Polling 대신 Task를 Block/Delay해야 합니다.
		// 여기서는 간단하게 1ms Delay를 사용합니다. (더 나은 방법은 Semaphore나 Task Notification 사용)
		vTaskDelay(pdMS_TO_TICKS(1));
	}
	uint8_t data = rx_buffer[rx_tail];
	rx_tail = (rx_tail + 1) % USART_RX_BUFFER_SIZE;
	return data;
}

uint8_t uart_is_available() {
	return (rx_head != rx_tail);
}

// 스케줄러 시작 전용 (폴링 방식)
void uart_initial_print(const char *s) {
	while (*s) {
		// UDRE0 대기
		while (!(UCSR0A & (1 << UDRE0)));
		UDR0 = *s++;
	}
}

// Task 내부용 (인터럽트 방식)
void uart_task_print(const char *s) {
	while (*s) {
		uart_tx(*s++);
	}
}

