
#include <avr/io.h>
#include "testFn.h"
#include "timer.h"

//아두이노 기본 LED 테스트
void LED_test(uint32_t delay_value){
	DDRB |= (1 << PB5);

	//LED 켜기 (ON): PORTB의 5번 비트를 1로 설정 (HIGH)
	PORTB |= (1 << PB5);
	
	//delay(delay_value);
	
	//LED 끄기 (OFF): PORTB의 5번 비트를 0으로 설정 (LOW)
	PORTB &= ~(1 << PB5);
}