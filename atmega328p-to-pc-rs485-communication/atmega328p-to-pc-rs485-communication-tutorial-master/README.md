# Interfacing ATmega328P with PC using RS485 Protocol

-------------------------------------------------------------------------------------------------------------------------------------------
<img src="https://www.xanthium.in/sites/default/files/site-images/atmega328p-rs485-pc-comm-tutorial/atmega328-pc-rs485-transmission.png" >

## Online Tutorial


   - [RS485 communication from ATmega328p microcontroller to PC Tutorial](https://www.xanthium.in/atmel-microchip-avr-atmega328p-rs485-communication-with-computer-tutorial-for-beginners)
   
## Introduction

Tutorial on interfacing your Windows 10 PC with an ATmega328P microcontroller using RS485 Protocol for Bidirectional Communication.

- **In the first case**,
  - ATmega328P will send a text string "Hello from ATmega328P" to PC where a C# application will read and display it on the console Window.

- **In the second case**,
  - PC will send ASCII charcters to the ATmega328P microcontroller through the RS485 link and the LED's connected to the Microcontroller will light up depending upon the command


## Toolchain /IDE

- The Code for ATmega328P is written in **AVR C** using **ATMEL Studio 7**.
- C# code is written using **Microsoft Visual Studio Community Edition 2019**.

## Tools used 

- ATmega328P Microcontroller
- MAX485 RS485 chip 
- [USB to RS485 Converter](https://www.xanthium.in/ft232-based-usb-to-serial-rs485-converter-industrial-scientific-applications)
- ![logo](https://www.xanthium.in/sites/default/files/site-images/usb2rs485-v2-2-product-page/ft232-usb-rs485-converter-v2-2-610px.png)
