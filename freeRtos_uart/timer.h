#define F_CPU 16000000UL
#include <avr/io.h> //reg
#include <util/delay.h>
#include <avr/interrupt.h> // 인터럽트 서비스 루틴
#include <util/atomic.h>
#include <stdint.h>

void timer0_init(void);
uint32_t millis(void);
uint32_t micros(void);
void delay(float ms);