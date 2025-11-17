
#include <avr/io.h>

#define PIN8_PORT PORTB
#define PIN8_DDR DDRB
#define PIN8_BIT (1<<PB0)

#define PIN9_PORT PORTB 
#define PIN9_DDR DDRB
#define PIN9_BIT (1<<PB1)

//모터 초기화 함수
void motor_init();

//led 테스트
//void LED_test(int32_t delay_value);

//첫번째 유량모터 구동시키는 함수
void motor_W1(int32_t data);

void motor_W2(int32_t data);
