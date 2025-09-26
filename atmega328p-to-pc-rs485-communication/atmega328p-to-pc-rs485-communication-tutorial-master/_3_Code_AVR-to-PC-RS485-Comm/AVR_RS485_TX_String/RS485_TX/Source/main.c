#include "uart.h"
#include <avr/io.h>
#include <util/delay.h>

#define USART_TX_BUFFER_SIZE 64
#define USART_RX_BUFFER_SIZE 64
#define F_CPU 16000000UL

// RS-485 방향 제어 핀 정의
#define RS485_PORT PORTD
#define RS485_DDR DDRD
#define RS485_DE_PIN PD3 // Directional Enable (Active High)
#define RS485_RE_PIN PD2 // Receive Enable (Active Low)

volatile uint8_t tx_buffer[USART_TX_BUFFER_SIZE];
volatile uint8_t tx_head = 0;
volatile uint8_t tx_tail = 0;
volatile uint8_t rx_buffer[USART_RX_BUFFER_SIZE];
volatile uint8_t rx_head = 0;
volatile uint8_t rx_tail = 0;


ISR(USART_RX_vect) {
    uint8_t data = UDR0;
    uint8_t next_head = (rx_head + 1) % USART_RX_BUFFER_SIZE;

    if (next_head == rx_tail) {
        return;
    }

    rx_buffer[rx_head] = data;
    rx_head = next_head;
}

ISR(USART_UDRE_vect) {
    if (tx_head == tx_tail) {
        UCSR0B &= ~(1 << UDRIE0);
        
        // 전송 완료 대기 및 수신 모드 전환
        loop_until_bit_is_set(UCSR0A, TXC0);
        RS485_PORT &= ~((1 << RS485_DE_PIN) | (1 << RS485_RE_PIN));
        UCSR0A |= (1 << TXC0);
        return;
    }

    UDR0 = tx_buffer[tx_tail];
    tx_tail = (tx_tail + 1) % USART_TX_BUFFER_SIZE;
}

void uart_init(uint32_t baud) {
    UBRR0 = (F_CPU / 16 / baud) - 1;
    UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
    UCSR0B = (1 << RXEN0) | (1 << TXEN0);
    UCSR0B |= (1 << RXCIE0);
    
    // RS-485 핀 초기화
    RS485_DDR |= (1 << RS485_DE_PIN) | (1 << RS485_RE_PIN);
    
    // 기본 상태: 수신 모드 (DE=LOW, ~RE=LOW)
    RS485_PORT &= ~((1 << RS485_DE_PIN) | (1 << RS485_RE_PIN));
}

void uart_tx(uint8_t data) {
    // 송신 시작 전, 송신 모드 활성화 (DE=HIGH, ~RE=HIGH)
    RS485_PORT |= (1 << RS485_DE_PIN) | (1 << RS485_RE_PIN);
    
    uint8_t next_head = (tx_head + 1) % USART_TX_BUFFER_SIZE;

    while (next_head == tx_tail) { }

    tx_buffer[tx_head] = data;
    tx_head = next_head;
    UCSR0B |= (1 << UDRIE0);
}

uint8_t uart_rx() {
    while (rx_head == rx_tail) { }
    uint8_t data = rx_buffer[rx_tail];
    rx_tail = (rx_tail + 1) % USART_RX_BUFFER_SIZE;
    return data;
}

uint8_t uart_is_available() {
    return (rx_head != rx_tail);
}

void uart_print(const char *s) {
    // uart_tx 함수에서 방향 제어가 이루어지므로
    // 이 함수에서는 별도의 방향 제어가 필요 없습니다.
    while (*s) {
        uart_tx(*s++);
    }
}