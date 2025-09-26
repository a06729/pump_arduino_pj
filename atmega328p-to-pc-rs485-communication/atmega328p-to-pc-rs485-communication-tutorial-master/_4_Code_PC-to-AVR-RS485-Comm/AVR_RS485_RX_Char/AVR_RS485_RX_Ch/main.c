//RS485 communication from ATmega328p microcontroller to PC Tutorial

//Website-> https://www.xanthium.in/atmel-microchip-avr-atmega328p-rs485-communication-with-computer-tutorial-for-beginners

// Program to receive characters A,B,C from a PC through RS485 cable and light up corresponding LED's //

/*
MAX485                               ATmega328p
+----------+               +--------------------+
|        RO|-------------->|PD0/RXD		     PB2|
|A       D1|<--------------|PD1/TXD		     PB3|
|B      ~RE|<--------------|PD2			     PB4|
|        DE|<--------------|PD3			     PB5|
+----------+               |                    |
                           +--------------------+

*/

//+------------------------------------------------------------------------------------------------+
//| Compiler           : AVR GCC (WinAVR)                                                          |
//| Microcontroller    : ATmega328p                                                                |
//| Programmer         : Rahul.Sreedharan                                                          |
//| Date               : 04-July-2020                                                             |
//+------------------------------------------------------------------------------------------------+

//(C) www.xanthium.in
// Visit to Learn More

//+------------------------------------------------------------------------------------------------+
//| Compiler           : AVR GCC (WinAVR)                                                          |
//| Microcontroller    : ATmega328p                                                                |
//| Programmer         : Rahul.Sreedharan                                                          |
//| Date               : 11-April-2019                                                             |
//+------------------------------------------------------------------------------------------------+

//(C) www.xanthium.in 
// Visit to Learn More 


#include <stdint.h>
#include <avr/io.h>

#define F_CPU  11059200
#include <util/delay.h>

// +-----------------------------------------------------------------------+ //
// | ATmega328p Baudrate values for UBRRn for external crystal 11.0592MHz  | //
// | All values from Datasheet                                             | //
// +-----------------------------------------------------------------------+ //

#define BAUD_RATE_4800_BPS  143 // 4800bps
#define BAUD_RATE_9600_BPS  103  // 9600bps

#define BAUD_RATE_14400_BPS  47 // 14.4k bps
#define BAUD_RATE_19200_BPS  35 // 19.2k bps
#define BAUD_RATE_28800_BPS  23 // 28.8k bps
#define BAUD_RATE_38400_BPS  17 // 38.4k bps
#define BAUD_RATE_57600_BPS  11 // 57.6k bps
#define BAUD_RATE_76800_BPS   8 // 76.8k bps

#define BAUD_RATE_115200_BPS  5 // 115.2k bps
#define BAUD_RATE_230400_BPS  2 // 230.4k bps



int main()
{
	
	unsigned int ubrr = BAUD_RATE_9600_BPS; 
	
	PORTC = 0x00; //All LED's OFF
	PORTD = 0x00;
	
	
	
	// RS485 Control Lines
	// PD2 -> ~RE (Active Low signal)
	// PD3 ->  DE
	
	DDRD  |= (1<<PD2) | (1<<PD3); // PD2,PD3 both Outputs
	PORTD &= ~(1<<PD3);            // PD3->  DE = Low; 
	PORTD &= ~(1<<PD2);            // PD2-> ~RE = Low; 
	                               //RS485 chip MAX485 Receive mode
	
	/* Set Baudrate  */
	UBRR0H = (ubrr>>8);
	UBRR0L = (ubrr);
	
	/*Enable receiver  */
	UCSR0B = (1<<RXEN0);
	
	/* Set frame format: 8data, 1stop bit */
	UCSR0C = 0x06;
	
	while(1)
	{
		while ( !(UCSR0A & (1<<RXC0)) ); /* Wait for data to be received */
	
		switch(UDR0)
		{
			case 'A' : 	DDRB  |= (1<<PB2); // Set Direction as output
						PORTB |= (1<<PB2); // Set PB2 Line High,LED1 high
						break;
				
            case 'B' : 	DDRB  |= (1<<PB3);// Set Direction as output 
						PORTB |= (1<<PB3);// Set PB3 Line High,LED2 High
						break;		
							
			case 'C' : 	DDRB  |= (1<<PB3);// Set Direction as output 
						DDRB  |= (1<<PB2);// Set Direction as output 
			            PORTB &= ~(1<<PB3); // Set PB3 Line Low
						PORTB &= ~(1<<PB2); // Set PB2 Line Low
						break;			
			default  :
						break;
	    }
	 }
}//end of main























