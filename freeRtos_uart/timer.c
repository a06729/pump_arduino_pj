// 상수 정의 (16MHz, 64 분주비 기준)
// 타이머0 오버플로우 시간 = 256 틱 * (64 / 16000000) = 1.024ms
#include "timer.h"
#define MICROS_PER_TIMER0_OVERFLOW (64 * 256 / (F_CPU / 1000000UL))
#define MILLIS_INC (MICROS_PER_TIMER0_OVERFLOW / 1000) // 오버플로우당 밀리초 증가량 (1)
#define FRACT_INC ((MICROS_PER_TIMER0_OVERFLOW % 1000) >> 3) // 오버플로우당 분수 밀리초 증가량 (3)
#define FRACT_MAX (1000 >> 3) // 분수 밀리초 최대값 (125)


// 타이머 관련 전역 변수
volatile uint32_t timer0_overflow_count = 0; // 타이머 오버플로우 횟수
volatile uint32_t timer0_millis = 0; // 밀리초 카운터
static uint8_t timer0_fract = 0; // 분수 밀리초 (정밀도 향상용)


// Timer0 오버플로우 인터럽트 서비스 루틴
ISR(TIMER0_OVF_vect) {
	// 현재 밀리초와 분수 밀리초 값 가져오기
	uint32_t m = timer0_millis;
	uint8_t f = timer0_fract;
	// 오버플로우당 증가량 더하기
	m += MILLIS_INC;
	f += FRACT_INC;

	// 분수 밀리초가 최대값을 초과하면 밀리초 1 추가
	if (f >= FRACT_MAX) {
		f -= FRACT_MAX;
		m += 1;
	}
	// 값 업데이트
	timer0_fract = f;
	timer0_millis = m;
	timer0_overflow_count++;
}

// Timer0 초기화 함수
void timer0_init(void) {
	// 인터럽트 비활성화
	cli();

	// 타이머/카운터 0 레지스터 초기화
	TCCR0A = 0; // 일반 모드

	// 분주비 64 설정 (CS01=1, CS00=1)
	// 16MHz에서 분주비 64일 때 타이머 클럭은 250kHz (4μs 간격)
	TCCR0B = (1 << CS01) | (1 << CS00);

	// 타이머 오버플로우 인터럽트 활성화
	TIMSK0 |= (1 << TOIE0);

	// 카운터와 플래그 초기화
	timer0_overflow_count = 0;
	timer0_millis = 0;
	timer0_fract = 0;

	// 인터럽트 활성화
	sei();
}


// 밀리초 반환 함수
uint32_t millis(void) {
	uint32_t m;

	// 원자적 블록 내에서 값 읽기 (인터럽트 영향 없이)
	ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
		m = timer0_millis;
	}

	return m;
}

// 마이크로초 반환 함수
uint32_t micros(void) {
	uint32_t m;
	uint8_t t;

	// 원자적 블록 내에서 오버플로우 카운트와 현재 타이머 값 읽기
	ATOMIC_BLOCK(ATOMIC_RESTORESTATE) {
		m = timer0_overflow_count;
		t = TCNT0;

		// 오버플로우 플래그가 설정되었지만 아직 인터럽트가 처리되지 않았는지 확인
		// 이 경우 수동으로 오버플로우 카운트 증가 필요
		if ((TIFR0 & (1 << TOV0)) && (t < 255)) {
			m++;
		}
	}

	// 총 마이크로초 계산
	// (오버플로우 횟수 * 256 + 현재 타이머값) * 타이머 틱당 μs
	return ((m << 8) + t) * (64 / (F_CPU / 1000000UL));
}

// 딜레이 함수 (밀리초)
void delay(float ms) {
	uint32_t start = millis();

	while ((millis() - start) < ms) {
		// 대기
	}
}