#ifndef PROTOCOL_H_
#define PROTOCOL_H_

#include <stdint.h>

// 프로토콜 설정
#define PROTOCOL_MAX_FRAME_SIZE 13
#define PROTOCOL_TIMEOUT_MS 100

// 데이터 구조체
typedef struct {
	uint8_t slave_id;
	char command;    // 'W' or 'R'
	uint8_t address;
	uint8_t data;    // 데이터가 없는 경우 0
} ProtocolData;

// 유틸리티 함수
int8_t hex_char_to_val(char c);
uint8_t hex_ascii_to_byte(const char* in);
void byte_to_hex_ascii(uint8_t val, char* out);
uint8_t calc_checksum_ascii(const char* ascii, uint8_t len);

// 프로토콜 프레임 생성/파싱
void build_ascii_frame(const ProtocolData* data, char* out_buf, uint8_t is_resp);
uint8_t parse_ascii_frame(const char* buf, ProtocolData* out_data);

#endif // PROTOCOL_H_