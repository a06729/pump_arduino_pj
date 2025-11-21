
#include <avr/io.h>
#include "motor.h"
#include "timer.h"
#include <util/delay.h>
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"

// 상수 정의 (이전 답변에서 사용된 기준 값들을 재사용합니다.)
#define PUMP_FLOW_RATE_S 1.667 // 100 ml/min을 초 단위로 변환한 값 (ml/s)
#define MIN_FLOW_TIME_MS 80      // 최소 구동 시간 80ms
#define TIME_OFFSET_S 0.05       // 가속 보상 시간 0.05초


#define PUMP_FLOW_RATE_S_M2 1.667 // 100 ml/min을 초 단위로 변환한 값 (ml/s)
#define MIN_FLOW_TIME_MS_M2 80      // 최소 구동 시간 80ms
#define TIME_OFFSET_S_M2 0.05       // 가속 보상 시간 0.05초


//공식 100/28047ms
//28047ms 모터의 유량 흐름 값
//3.22
const double Pump_Flow=2.82;

//두번째 모터
const double Pump_Flow_Second=2.92;

void motor_init(){
	PIN8_DDR |=PIN8_BIT;
	PIN9_DDR |= PIN9_BIT;
}

//모터1 함수
void motor_W1(int32_t data){
	// 1. target을 double로 형 변환하여 정수 나눗셈 오류 방지
	double target_d = (double)data;
	
	double C=0; // 보정 계수 변수 선언
	
	if (data <= 150) {
		C = 0.603; // 작은 양에 대해 이전 보정 계수 사용
	}else if(data<=200){
		C= 0.673;
	} 
	else {
		//0.820 이전값 (275ml를 넣었을시 정확하게 나온다)
		C = 0.820; // 큰 양에 대해 새로운 보정 계수 사용 (예시 값)
	}
		
	// 2. 보정된 시간 계산 (단위: 초)
	// Time(s) = (Target / Flow_Rate + T_offset) * C
	double time_in_seconds = (target_d / PUMP_FLOW_RATE_S + TIME_OFFSET_S) * C;
	
	// 3. 밀리초(ms)로 변환
	int32_t flow_time = (int32_t)(time_in_seconds * 1000.0);

	// 4. 최소 시간 보장
	if (flow_time < MIN_FLOW_TIME_MS) {
		flow_time = MIN_FLOW_TIME_MS;
	}
	
	PORTB |= (1<<PB0);
	delay(flow_time);
	PORTB &= ~(1<<PB0);
}

//모터2 동작시키는 기능
void motor_W2(int32_t data){
	
	double target_d = (double)data;
	
	double C=0; // 보정 계수 변수 선언
	
	if (data <= 150) {
		C = 0.603; // 작은 양에 대해 이전 보정 계수 사용
	}else if(data<=200){
		//이전값:0.643
		C= 0.633;
	}else {
		//0.700 이전값 (275ml를 넣었을시 정확하게 나온다)
		C = 0.660; // 큰 양에 대해 새로운 보정 계수 사용 (예시 값)
	}
	
	// 2. 보정된 시간 계산 (단위: 초)
	// Time(s) = (Target / Flow_Rate + T_offset) * C
	double time_in_seconds = (target_d / PUMP_FLOW_RATE_S_M2 + TIME_OFFSET_S_M2) * C;
	
	// 3. 밀리초(ms)로 변환
	int32_t flow_time = (int32_t)(time_in_seconds * 1000.0);

	// 4. 최소 시간 보장
	if (flow_time < MIN_FLOW_TIME_MS_M2) {
		flow_time = MIN_FLOW_TIME_MS_M2;
	}
	
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