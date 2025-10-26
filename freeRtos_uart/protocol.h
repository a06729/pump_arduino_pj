
//write 명령
// $   SlaveId  W    주소  쓰기값 checkSum값 \n(아스키코드값)
//0x24   0x01  0x57  0x05  0xAA     0x07     0x0A
// $   SlaveId  R    주소  checkSum값  \n
//0x24  0x01   0x52  0x05  0x58      0x0A


// --- 프로토콜 정의 ---
#define MY_SLAVE_ID             0x01  // 이 장치의 Slave ID
#define PROTOCOL_BUFFER_SIZE    16    // 수신 패킷 버퍼 크기 ('$'...'\n' 포함)

// PDF 프레임 인덱스 정의 [cite: 29, 31]
#define FRAME_IDX_START         0
#define FRAME_IDX_ID            1
#define FRAME_IDX_CMD           2
#define FRAME_IDX_ADDR          3
#define FRAME_IDX_W_DATA        4 // 쓰기 명령(W)일 경우 데이터 위치
#define FRAME_IDX_W_CHECKSUM    5
#define FRAME_IDX_W_END         6

#define FRAME_IDX_R_DATA        4 // 읽기 응답(R)일 경우 데이터 위치
#define FRAME_IDX_R_CHECKSUM    4
#define FRAME_IDX_R_END         6
// ---------------------


uint8_t calculate_checksum(uint8_t *buffer, uint8_t length);

void send_response(uint8_t slave_id, uint8_t cmd, uint8_t addr, uint8_t data);


 void process_packet(uint8_t *buffer, uint8_t length);