# FreeRTOS 기반 RS-485 통신 및 이중 모터 정밀 제어 시스템

본 프로젝트는 **AVR (ATmega) 마이크로컨트롤러**와 **FreeRTOS V9.0.0**을 활용하여 구현된 임베디드 제어 시스템입니다. 산업용 통신 표준인 RS-485를 통해 마스터와 데이터를 주고받으며, 수신된 명령에 따라 두 개의 모터를 정밀하게 구동하여 유량을 제어하는 기능을 수행합니다.

## 🚀 주요 특징 (Key Features)

- **Real-Time Task Management (FreeRTOS)**: 실시간 운영체제를 도입하여 데이터 수신, 프로토콜 파싱, 모터 제어 업무를 개별 태스크로 분리하고 우선순위에 따른 멀티태스킹을 구현했습니다.
- **RS-485 기반 커스텀 프로토콜**: 안정적인 장거리 통신을 위해 체크섬(Checksum) 검증 및 빅 엔디안(Big-Endian) 32비트 데이터 형식을 지원하는 마스터-슬레이브 프로토콜을 설계 및 구현했습니다.
- **정밀 유량 제어 알고리즘**: 모터 구동 시 발생하는 가속 및 저항을 고려한 보정 계수(Calibration Factor) 기반 제어 로직을 적용하여 높은 정확도의 유량 제어를 실현했습니다.
- **Efficient Inter-Task Communication**: FreeRTOS Queue를 사용하여 태스크 간 데이터를 안전하게 전달하며, 데이터 유실을 방지하고 시스템 반응성을 최적화했습니다.

## 🛠 기술 스택 (Tech Stack)

- **Language**: C (Embedded)
- **RTOS**: FreeRTOS V9.0.0
- **Hardware**: AVR (ATmega series, 16MHz)
- **Peripherals**: UART, RS-485 (RE/DE control), PWM/Digital IO, Timer
- **IDE/Tools**: Microchip Studio (Atmel Studio), AVR-GCC

## 🏗 시스템 아키텍처 (System Architecture)

### 1. Task 구조
- **RxTask (Priority High)**: UART 인터럽트 링 버퍼에서 데이터를 읽어 FreeRTOS Queue로 전송합니다.
- **ProtoTask (Priority Mid)**: 큐에서 바이트 데이터를 조합하여 패킷을 완성하고, 체크섬 검증 후 해당 명령을 수행합니다.
- **Motor1/2Task (Priority Low)**: 모터 구동 명령을 수신하여 실제 하드웨어 핀을 제어하고 정밀한 시간 동안 동작시킵니다.

### 2. 커스텀 프로토콜 정의
| 필드 | 시작 문자 | Slave ID | 명령 (CMD) | 주소 (ADDR) | 데이터 (DATA) | 체크섬 | 종료 문자 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **길이** | 1 Byte | 1 Byte | 1 Byte | 1 Byte | 4 Bytes | 1 Byte | 1 Byte |
| **예시** | `$` | `0x01` | `'W'` | `0x01` | `32-bit int` | `SUM(1..7)` | `\n` |

## 💻 주요 구현 내용 (Code Highlights)

### 정밀 모터 제어 로직 (`motor.c`)
단순 On/Off 제어가 아닌, 목표 유량에 따른 구동 시간을 동적으로 계산합니다. 유량의 범위에 따라 서로 다른 보정 계수(`C`)를 적용하여 물리적 오차를 최소화했습니다.

```c
// 목표 유량에 따른 구동 시간 계산 로직
double time_in_seconds = (target_d / PUMP_FLOW_RATE_S + TIME_OFFSET_S) * C;
int32_t flow_time = (int32_t)(time_in_seconds * 1000.0);
```

### 프로토콜 처리 및 태스크 간 통신 (`protocol.c`, `main.c`)
수신된 32비트 데이터를 비트 연산을 통해 복원하고, 적절한 모터 제어 큐로 전달합니다.

```c
// 32비트 데이터 복원 및 큐 전송
data_32bit = ((int32_t)((uint32_t)d0 << 24) | ((uint32_t)d1 << 16) | ...);
if (addr == 1) {
    xQueueSendToBack(xMoter1Queue, &data_32bit, portMAX_DELAY);
}
```

## 📈 성과 및 배운 점

- **RTOS 활용 능력**: RTOS의 핵심 요소인 Task, Queue, Semaphore 등을 실제 프로젝트에 적용하며 동시성 제어 및 자원 관리 능력을 배양했습니다.
- **통신 신뢰성 확보**: 노이즈가 많은 환경에서도 안정적인 통신을 위해 소프트웨어 레이어에서 체크섬 및 패킷 구조를 견고하게 설계하는 경험을 쌓았습니다.
- **하드웨어 제어 최적화**: 임베디드 환경의 제한된 자원 내에서 정밀한 타이밍 제어를 위해 타이머와 인터럽트를 효율적으로 사용하는 방법을 익혔습니다.
