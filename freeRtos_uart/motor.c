
#include <avr/io.h>
#include "motor.h"
#include "timer.h"
#include <util/delay.h>

//28047ms 모터의 유량 흐름 값
const float Pump_Flow=3.57;


void motor_init(){
	PIN8_DDR |=PIN8_BIT;
	PIN9_DDR |= PIN9_BIT;
}
//모터 동작시키는 기능
void motor_W1(uint8_t data){
   uint8_t target = data;
   double flow_time = (target/Pump_Flow) * 1000;
   
   PORTB |= (1<<PB0); 
   delay(flow_time);
   PORTB &= ~(1<<PB0);
}