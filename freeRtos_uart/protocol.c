/*
 * protocol.c
 *
 * Created: 2025-10-26 오후 3:25:27
 *  Author: Administrator
 */ 

#include <avr/io.h>

#include "uart.h"
#include "protocol.h"

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
void send_response(uint8_t slave_id, uint8_t cmd, uint8_t addr, uint8_t data) {
	uint8_t response[7]; // 응답 프레임 (7바이트 고정)
	uint8_t checksum;

	response[0] = '$';
	response[1] = slave_id;
	response[2] = cmd;
	response[3] = addr;
	response[4] = data; // R 응답 시 읽은 데이터
	
	// 체크섬 계산: ID부터 데이터까지의 합
	checksum = calculate_checksum(&response[1], 4);
	
	response[5] = checksum;
	response[6] = '\n';

	// uart_tx 함수는 RS-485 송신 모드를 자동으로 처리합니다.
	for (uint8_t i = 0; i < 7; i++) {
		uart_tx(response[i]);
	}
}


/**
 * @brief 수신된 패킷을 파싱하고 처리합니다. (Slave 로직) 
 * @param buffer 수신된 전체 패킷 ('$'...'\n' 포함)
 * @param length 패킷의 전체 길이
 */
void process_packet(uint8_t *buffer, uint8_t length) {
	// 1. 최소 길이 확인 (W: 7바이트, R: 6바이트)
	if (length < 6) return; // 너무 짧음

	// 2. Slave ID 확인
	uint8_t slave_id = buffer[FRAME_IDX_ID];
	if (slave_id != MY_SLAVE_ID) {
		return; // 이 장치를 위한 패킷이 아님
	}

	// 3. 체크섬 확인
	uint8_t cmd = buffer[FRAME_IDX_CMD];
	uint8_t addr = buffer[FRAME_IDX_ADDR];
	uint8_t received_checksum;
	uint8_t calculated_checksum;
	uint8_t data_len_for_checksum;

	if (cmd == 'W') {
		
		if (length != 7) return; // 'W' 명령은 7바이트여야 함
		received_checksum = buffer[FRAME_IDX_W_CHECKSUM];
		data_len_for_checksum = 4; // ID, Cmd, Addr, Data
		
		} else if (cmd == 'R') {
		
		if (length != 6) return; // 'R' 명령은 6바이트여야 함  (Data 필드 없음)
		received_checksum = buffer[length - 2]; // Checksum은 \n 바로 앞
		data_len_for_checksum = 3; // ID, Cmd, Addr
		
		} else {
		return; // 알 수 없는 명령
	}
	
	calculated_checksum = calculate_checksum(&buffer[FRAME_IDX_ID], data_len_for_checksum);

	if (received_checksum != calculated_checksum) {
		return; // 체크섬 오류
		}else{
		// 4. 유효성 검사 통과 -> 명령 처리
		uint8_t data;
		if (cmd == 'W') {
			data = buffer[FRAME_IDX_W_DATA];
			if (addr < 16) { // 가상 레지스터 범위 확인
				g_device_registers[addr] = data;
			}
			// 'W' 명령에 대한 응답
			send_response(slave_id, cmd, addr, data);
			
			} else if (cmd == 'R') {
			data = 0;
			if (addr < 16) { // 가상 레지스터 범위 확인
				data = g_device_registers[addr];
			}
			// 'R' 명령에 대한 응답
			send_response(slave_id, cmd, addr, data);
		}
	}


}