#define F_CPU 16000000UL
#define BAUD 9600
#define UBRR_VALUE (F_CPU / 16 / BAUD - 1)


#define USART_TX_BUFFER_SIZE 64
#define USART_RX_BUFFER_SIZE 64


// RS-485 방향 제어 핀 정의
#define RS485_PORT PORTD
#define RS485_DDR DDRD
#define RS485_DE_PIN PD3 // Directional Enable (Active High)
#define RS485_RE_PIN PD2 // Receive Enable (Active Low)


// -----------------------------------------------------------
// 2. UART/RS-485 드라이버 함수 선언
// -----------------------------------------------------------
void uart_tx(uint8_t data);
uint8_t uart_rx();
uint8_t uart_is_available();
void uart_init(uint32_t baud);
void uart_initial_print(const char *s); // 스케줄러 시작 전용 폴링 출력
void uart_task_print(const char *s); // Task 내부 인터럽트 출력


