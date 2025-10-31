
#include <avr/io.h>

#define PIN8_PORT PORTB
#define PIN8_DDR DDRB
#define PIN8_BIT (1<<PB0)

#define PIN9_PORT PORTB 
#define PIN9_DDR DDRB
#define PIN9_BIT (1<<PB1)

//모터 초기화 함수
void motor_init();

//첫번째 유량모터 구동시키는 함수
void motor_W1();
