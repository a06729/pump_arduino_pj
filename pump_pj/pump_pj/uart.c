#include "uart.h"
#define USART_TX_BUFFER_SIZE 64
#define USART_RX_BUFFER_SIZE 64
#define F_CPU 16000000UL


volatile uint8_t tx_buffer[USART_TX_BUFFER_SIZE];
volatile uint8_t tx_head = 0;
volatile uint8_t tx_tail = 0;
volatile uint8_t rx_buffer[USART_RX_BUFFER_SIZE];
volatile uint8_t rx_head = 0;
volatile uint8_t rx_tail = 0;


ISR(USART_RX_vect){
	uint8_t data = UDR0;
	uint8_t next_head = (rx_head + 1) % USART_RX_BUFFER_SIZE;

	if(next_head == rx_tail) {
		return;
	}

	rx_buffer[rx_head] = data;
	rx_head = next_head;
}

ISR(USART_UDRE_vect){
	if(tx_head == tx_tail){
		UCSR0B &= ~(1 << UDRIE0);
		return;
	}

	UDR0 = tx_buffer[tx_tail];
	tx_tail = (tx_tail + 1) % USART_TX_BUFFER_SIZE;
}

void uart_init(uint32_t baud){
	UBRR0 = (F_CPU / 16 / baud) - 1;
	UCSR0C = (1 << UCSZ01) | (1 << UCSZ00);
	UCSR0B = (1 << RXEN0) | (1 << TXEN0);
	UCSR0B |= (1 << RXCIE0);
}

void uart_tx(uint8_t data){
	uint8_t next_head = (tx_head + 1) % USART_TX_BUFFER_SIZE;

	while (next_head == tx_tail){ }

	tx_buffer[tx_head] = data;
	tx_head = next_head;
	UCSR0B |= (1 << UDRIE0);
}

uint8_t uart_rx(){
	while(rx_head == rx_tail){ }
	uint8_t data = rx_buffer[rx_tail];
	rx_tail = (rx_tail + 1) % USART_RX_BUFFER_SIZE;
	return data;
}

uint8_t uart_is_available(){
	return (rx_head != rx_tail);
}

void uart_print(const char *s){
	while(*s){
		uart_tx(*s++);
	}
}