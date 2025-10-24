#include "protocol.h"
#include <string.h>

// ASCII HEX 2자리 -> uint8_t 변환
int8_t hex_char_to_val(char c) {
    if (c >= '0' && c <= '9') return (int8_t)(c - '0');
    if (c >= 'A' && c <= 'F') return (int8_t)(c - 'A' + 10);
    return -1;
}

uint8_t hex_ascii_to_byte(const char* in) {
    int8_t hi = hex_char_to_val(in[0]);
    int8_t lo = hex_char_to_val(in[1]);
    if (hi < 0 || lo < 0) return 0;
    return (uint8_t)((hi << 4) | lo);
}

void byte_to_hex_ascii(uint8_t val, char* out) {
    const char hex[] = "0123456789ABCDEF";
    out[0] = hex[(val >> 4) & 0x0F];
    out[1] = hex[val & 0x0F];
}

// 체크섬 계산
uint8_t calc_checksum_ascii(const char* ascii, uint8_t len) {
    uint8_t sum = 0;
    for (uint8_t i = 0; i < len; i++) {
        sum += (uint8_t)ascii[i];
    }
    return sum;
}

// 프로토콜 프레임 생성
void build_ascii_frame(const ProtocolData* data, char* out_buf, uint8_t is_resp) {
    uint8_t i = 0;
    out_buf[i++] = is_resp ? ':' : '$';

    byte_to_hex_ascii(data->slave_id, &out_buf[i]); i += 2;
    out_buf[i++] = data->command;
    byte_to_hex_ascii(data->address, &out_buf[i]); i += 2;

    uint8_t has_data = 0;
    if ((out_buf[0] == '$' && data->command == 'W') ||
        (out_buf[0] == ':' && data->command == 'R')) {
        has_data = 1;
        byte_to_hex_ascii(data->data, &out_buf[i]); i += 2;
    }

    uint8_t checksum_len = has_data ? 7 : 5;
    char ascii_part[8];
    memcpy(ascii_part, &out_buf[1], checksum_len);
    ascii_part[checksum_len] = '\0';

    uint8_t chk = calc_checksum_ascii(ascii_part, checksum_len);
    byte_to_hex_ascii(chk, &out_buf[i]); i += 2;

    out_buf[i++] = '\n';
    out_buf[i] = '\0';
}

// 프로토콜 프레임 파싱
uint8_t parse_ascii_frame(const char* buf, ProtocolData* out_data) {
    if (!buf || !out_data) return 0;

    uint8_t len = (uint8_t)strlen(buf);
    if (len < 9) return 0;
    if ((buf[0] != '$' && buf[0] != ':')) return 0;
    if (buf[len - 1] != '\n') return 0;

    char cmd = buf[3];
    if (cmd != 'W' && cmd != 'R') return 0;

    uint8_t has_data = 0;
    if ((buf[0] == '$' && cmd == 'W' && len == 11) || 
        (buf[0] == ':' && cmd == 'R' && len == 11)) {
        has_data = 1;
    } else if ((buf[0] == '$' && cmd == 'R' && len == 9) ||
               (buf[0] == ':' && cmd == 'W' && len == 9)) {
        has_data = 0;
    } else {
        return 0;
    }

    uint8_t ascii_len = has_data ? 7 : 5;
    char ascii_part[8];
    memcpy(ascii_part, &buf[1], ascii_len);
    ascii_part[ascii_len] = '\0';

    uint8_t checksum_calc = calc_checksum_ascii(ascii_part, ascii_len);
    uint8_t checksum_recv = hex_ascii_to_byte(&buf[ascii_len + 1]);
    if (checksum_calc != checksum_recv) return 0;

    out_data->slave_id = hex_ascii_to_byte(&buf[1]);
    out_data->command = cmd;
    out_data->address = hex_ascii_to_byte(&buf[4]);
    out_data->data = has_data ? hex_ascii_to_byte(&buf[6]) : 0;

    return 1;
}