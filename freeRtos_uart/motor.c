
#include <avr/io.h>
#include "motor.h"
#include "timer.h"
#include <util/delay.h>
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"

//공식 100/28047ms
//28047ms 모터의 유량 흐름 값
//3.22
const double Pump_Flow=2.92;

//두번째 모터
const double Pump_Flow_Second=2.92;

void motor_init(){
	PIN8_DDR |=PIN8_BIT;
	PIN9_DDR |= PIN9_BIT;
}

//모터1 동작시키는 기능
void motor_W1(int32_t data){
   int32_t target = data;
   double flow_time = (target/Pump_Flow) * 1000;
 
   PORTB |= (1<<PB0); 
   delay(flow_time);
   PORTB &= ~(1<<PB0);
}

//모터2 동작시키는 기능
void motor_W2(int32_t data){
	
	int32_t target = data;
	double flow_time = (target/Pump_Flow_Second) * 1000;
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