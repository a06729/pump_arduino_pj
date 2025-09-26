/*
 * pump_pj.c
 *
 * Created: 2025-09-12 오전 9:45:54
 * Author : WIN
 */ 

#include <avr/io.h>
#include <avr/interrupt.h>
#include "uart.h"
#include "timer.h"

int main(void)
{
	uart_init(9600);
	timer0_init();
	sei();
    /* Replace with your application code */
    while (1) 
    {
		//uart_print("Received and echoed!\n");
        if(uart_is_available()) {
            // 데이터를 한 바이트 읽어옵니다.
            uint8_t received_data = uart_rx();

            // 받은 데이터를 그대로 다시 전송합니다.
            uart_tx(received_data);
        }
		//delay(1000);
    }
}

