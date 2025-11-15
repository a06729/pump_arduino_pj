
#include <avr/io.h>
#include "motor.h"
#include "timer.h"
#include <util/delay.h>


//공식 100/28047ms
//28047ms 모터의 유량 흐름 값
const float Pump_Flow=3.22;

//두번째 모터
const float Pump_Flow_Second=2.92;

void motor_init(){
	PIN8_DDR |=PIN8_BIT;
	PIN9_DDR |= PIN9_BIT;
}

//모터1 동작시키는 기능
void motor_W1(uint32_t data){
   uint32_t target = data;
   float flow_time = (target/Pump_Flow) * 1000;
 
   PORTB |= (1<<PB0); 
   delay(flow_time);
   PORTB &= ~(1<<PB0);
}

//모터2 동작시키는 기능
void motor_W2(uint32_t data){
	
	uint32_t target = data;
	float flow_time = (target/Pump_Flow_Second) * 1000;
	PORTB |= (1<<PB1);
	delay(flow_time);
	PORTB &= ~(1<<PB1);
}

//모터 2개 정지
void all_stop_motor(){
	//모터1 정지
	PORTB &= ~(1<<PB0);
	//모터2 정지
	PORTB &= ~(1<<PB1);
}