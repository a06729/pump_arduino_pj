/*
 * protocol.c
 *
 * Created: 2025-10-26 오후 3:25:27
 *  Author: Administrator
 */ 

#include <avr/io.h>

#include "uart.h"
#include "protocol.h"
#include "FreeRTOS/FreeRTOS.h"
#include "FreeRTOS/task.h"
#include "FreeRTOS/queue.h"
#include "motor.h"


//main.c 파일에 있는 xMoter1Queue을 가져오기위한 전역변수
extern QueueHandle_t xMoter1Queue;

extern QueueHandle_t xMoter2Queue;

extern TaskHandle_t xMotor1_Handle;

extern TaskHandle_t xMotor2_Handle;



// 가상의 데이터 저장소 (Address 0x00 ~ 0x0F)
uint8_t g_device_registers[16] = {0};

/**
 * @brief PDF 프로토콜에 정의된 체크섬을 계산합니다. 
 * @param buffer '$'를 제외한 패킷 데이터 (ID부터 Checksum 앞까지)
 * @param length 체크섬 계산에 포함될 바이트 수
 * @return 계산된 체크섬
 */
uint8_t calculate_checksum(uint8_t *buffer, uint8_t length) {
	uint8_t sum = 0;
	for (uint8_t i = 0; i < length; i++) {
		sum += buffer[i];
	}
	return sum;
}



/**
 * @brief Master에게 보낼 응답 프레임을 생성하고 전송합니다. 
 * @param slave_id 응답하는 Slave ID
 * @param cmd 'W' 또는 'R'
 * @param addr 처리한 주소
 * @param data 'R' 명령의 경우 읽은 값, 'W' 명령의 경우 쓴 값
 */
void send_response(uint8_t slave_id, uint8_t cmd, uint8_t addr, int32_t data) {
	
	// 1. 응답 프레임 크기 10바이트로 변경
	uint8_t response[10];
	uint8_t checksum;

	response[FRAME_IDX_START] = '$';
	response[FRAME_IDX_SlaveID] = slave_id;
	response[FRAME_IDX_CMD] = cmd;
	response[FRAME_IDX_ADDR] = addr;
	
	// 2. 32비트 데이터를 4바이트로 분리 (Big-Endian)
	response[FRAME_IDX_W_DATA_D0] = (uint8_t)(data >> 24); // D0 (MSB)
	response[FRAME_IDX_W_DATA_D1] = (uint8_t)(data >> 16); // D1
	response[FRAME_IDX_W_DATA_D2] = (uint8_t)(data >> 8);  // D2
	response[FRAME_IDX_W_DATA_D3] = (uint8_t)(data & 0xFF);  // D3 (LSB)

	// 3. 체크섬 계산 범위 변경 (ID부터 D3까지, 총 7바이트)
	checksum = calculate_checksum(&response[1], 7);
	
	// 4. 체크섬과 종료 문자 위치 변경
	response[FRAME_IDX_W_CHECKSUM] = checksum;
	response[FRAME_IDX_W_END] = '\n';

	// 5. 전송 루프 범위 변경 (10바이트)
	for (uint8_t i = 0; i < 10; i++) {
		uart_tx(response[i]);
	}
}


/**
 * @brief 수신된 패킷을 파싱하고 처리합니다. (Slave 로직) 
 * @param buffer 수신된 전체 패킷 ('$'...'\n' 포함)
 * @param length 패킷의 전체 길이
 */
void process_packet(uint8_t *buffer, uint8_t length) {
	// 1. 최소 길이 확인 (R: 6바이트, W: 10바이트)
	// 'R' 명령은 4바이트 데이터를 반환해야 하므로 응답 길이가 10바이트가 됩니다.
	// 'R' 요청 자체는 6바이트일 수 있지만, 프로토콜 일관성을 위해
	// 'R' 응답도 4바이트 데이터를 포함하도록 변경하는 것을 가정합니다.
	// 여기서는 'W' 명령만 10바이트라고 가정하고, 'R'은 6바이트로 유지해 봅니다.
	// (이 부분은 프로토콜 정책에 따라 달라집니다)

	if (length < 6) {
		return;
	}

	uint8_t slave_id = buffer[FRAME_IDX_SlaveID]; // ID
	if (slave_id != MY_SLAVE_ID) {
		return;
	}

	uint8_t cmd = buffer[FRAME_IDX_CMD];  // Cmd
	uint8_t addr = buffer[FRAME_IDX_ADDR]; // Addr
	uint8_t received_checksum;
	uint8_t calculated_checksum;
	uint8_t data_len_for_checksum;

	if (cmd == 'W') {
		// 'W' 명령은 10바이트여야 함 ($ ID W Addr D0 D1 D2 D3 Chk \n)
		if (length != 10) {
			return; // 'W' 명령 길이 불일치
		}
		
		// 체크섬은 9번째 바이트 (인덱스 8)
		received_checksum = buffer[FRAME_IDX_W_CHECKSUM];
		
		// 체크섬 계산 범위: ID, Cmd, Addr, D0, D1, D2, D3 (총 7바이트)
		data_len_for_checksum = 7;
		
	} else if (cmd == 'R') {
		// 'R' 명령은 6바이트로 유지한다고 가정 ($ ID R Addr Chk \n)
		if (length != 6) {
			return; // 'R' 명령 길이 불일치
		}
		
		received_checksum = buffer[FRAME_IDX_R_CHECKSUM];
		data_len_for_checksum = 3; // ID, Cmd, Addr
		
	} else {
		return; // 알 수 없는 명령
	}
	
	calculated_checksum = calculate_checksum(&buffer[1], data_len_for_checksum);

	if (received_checksum != calculated_checksum) {
		return; // 체크섬 오류
	}
	
	// --- 체크섬 통과 ---
	
	int32_t data_32bit = 0; // 32비트 데이터를 저장할 변수

	if (cmd == 'W') {
		// 4. (핵심) 4바이트(D0~D3)를 32비트 int로 조립 (Big-Endian)
		uint8_t d0 = buffer[FRAME_IDX_W_DATA_D0]; // 0x01 (MSB)
		uint8_t d1 = buffer[FRAME_IDX_W_DATA_D1]; // 0x02
		uint8_t d2 = buffer[FRAME_IDX_W_DATA_D2]; // 0x03
		uint8_t d3 = buffer[FRAME_IDX_W_DATA_D3]; // 0x04 (LSB)
		
		// (uint32_t)로 먼저 캐스팅 후 비트 이동, 마지막에 int32_t로 변환
		data_32bit = ((int32_t)((uint32_t)d0 << 24) |
		((uint32_t)d1 << 16) |
		((uint32_t)d2 << 8)  |
		(uint32_t)d3);

		// 5. 데이터 저장 (g_device_registers가 int32_t[]라고 가정)
		//if (addr < 4) { // 예: 레지스터 4개 (0~3)
		//	g_device_registers[addr] = data_32bit;
		//}
		
		/* 6. 큐로 데이터 전송
		/* 명령 수행
		**/
		if (addr == 1) {
			xQueueSendToBack(xMoter1Queue, &data_32bit, portMAX_DELAY);
		} else if (addr == 2) {
			xQueueSendToBack(xMoter2Queue, &data_32bit, portMAX_DELAY);
		}else if(addr == 3){
			//all_stop_motor();a
			//모터1 테스트 삭제
			vTaskDelete(xMotor1_Handle);
			vTaskDelete(xMotor2_Handle);
			all_stop_motor();
		}
	
		// 7. 'W' 응답 (수정된 send_response 호출)
		send_response(slave_id, cmd, addr, data_32bit);

		} else if (cmd == 'R') {
		// 'R' 명령은 g_device_registers에서 32비트 값을 읽어 응답
		if (addr < 4) {
			data_32bit = g_device_registers[addr];
		}
		
		// 7. 'R' 응답 (수정된 send_response 호출)
		send_response(slave_id, cmd, addr, data_32bit);
	}
}