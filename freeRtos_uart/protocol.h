

//write 명령 (데이터 10진수 260을 보낼때 예시)
// $   SlaveId  W    주소  DATA0값 DATA1값 DATA2값 DATA3값  checkSum값 \n(아스키코드값) 
//0x24  0x01   0x57  0x01  0x00    0x00    0x01    0x04      0x5E     0x0A

//read 명령
// $   SlaveId  R    주소  checkSum값  \n
//0x24  0x01   0x52  0x05  0x58      0x0A

// --- 프로토콜 정의 ---
#define MY_SLAVE_ID             0x01  // 이 장치의 Slave ID
#define PROTOCOL_BUFFER_SIZE    16    // 수신 패킷 버퍼 크기 ('$'...'\n' 포함)

// PDF 프레임 인덱스 정의 
#define FRAME_IDX_START         0 // 프로토콜의 시작 문자가 저장된 INDEX 위치 ex) $
#define FRAME_IDX_SlaveID       1 // SlaveID가 저장된 배열의 INDEX 위치 
#define FRAME_IDX_CMD           2 // 명령 커맨드가 저장된 위치의 배열 INDEX 위치
#define FRAME_IDX_ADDR          3 // 주소를 저장된 위치의 배열 INDEX 위치 tip)현재는 모터1,2를 사용할지 정하는 분기점으로 사용

//W 명령어일 경우 int 값을 표현하기 위해서 DATA 크기가 4bit로 설정
#define FRAME_IDX_W_DATA_D0     4 // 쓰기 명령(W)일 경우 데이터 위치 (D0)
#define FRAME_IDX_W_DATA_D1     5 // 쓰기 명령(W)일 경우 데이터 위치 (D1)
#define FRAME_IDX_W_DATA_D2     6 // 쓰기 명령(W)일 경우 데이터 위치 (D2)
#define FRAME_IDX_W_DATA_D3     7 // 쓰기 명령(W)일 경우 데이터 위치 (D3)
#define FRAME_IDX_W_CHECKSUM    8 //체크섬 배열 인덱스 위치
#define FRAME_IDX_W_END         9 //끝 문자가 저장된 배열 INDEX 위치

#define FRAME_IDX_R_CHECKSUM    4
#define FRAME_IDX_R_END         5
// ---------------------


uint8_t calculate_checksum(uint8_t *buffer, uint8_t length);

void send_response(uint8_t slave_id, uint8_t cmd, uint8_t addr, int32_t data);


void process_packet(uint8_t *buffer, uint8_t length);