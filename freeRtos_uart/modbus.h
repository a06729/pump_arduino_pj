#ifndef MODBUS_H
#define MODBUS_H

#include <stdint.h>
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"

// --- Modbus 설정 ---

// 이 슬레이브 장치의 Modbus ID
#define MODBUS_SLAVE_ID 1

// Modbus RTU 프레임 수신 타임아웃 (3.5 문자 시간)
// 9600-19200 baud에서 5ms 정도면 안전합니다.
#define MODBUS_FRAME_TIMEOUT_MS 5

// Modbus 프레임 최대 크기
#define MODBUS_BUFFER_SIZE 128

// (예제) 홀딩 레지스터 개수
#define HOLDING_REGISTERS_COUNT 16

// --- Modbus 예외 코드 ---
#define MODBUS_EXCEPTION_ILLEGAL_FUNCTION 0x01
#define MODBUS_EXCEPTION_ILLEGAL_DATA_ADDRESS 0x02
#define MODBUS_EXCEPTION_ILLEGAL_DATA_VALUE 0x03

// --- Modbus 데이터 저장소 ---
// main.c 또는 다른 모듈에서 접근할 수 있도록 extern으로 선언
extern uint16_t g_holding_registers[HOLDING_REGISTERS_COUNT];

// --- 함수 프로토타입 ---

/**
 * @brief Modbus 슬레이브 태스크
 * vTxTask를 대체합니다. UART 큐에서 바이트를 수신하여 Modbus 프레임을 조립하고 처리합니다.
 */
void vModbusTask(void *pvParameters);

/**
 * @brief Modbus 레지스터 초기화
 * main()에서 스케줄러 시작 전에 호출합니다.
 */
void modbus_init(void);

#endif // MODBUS_H