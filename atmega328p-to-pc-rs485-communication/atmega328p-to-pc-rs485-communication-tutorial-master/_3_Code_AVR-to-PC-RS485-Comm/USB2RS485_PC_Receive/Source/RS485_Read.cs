
//RS485 communication from ATmega328p microcontroller to PC Tutorial

//Website-> https://www.xanthium.in/atmel-microchip-avr-atmega328p-rs485-communication-with-computer-tutorial-for-beginners

//====================================================================================================//
//   Program to receive the data send from the microcontroller (ATmega328P) through RS485 network     //
//====================================================================================================//


//====================================================================================================//
// Program opens a  connection to USB to RS485 Converter board and configures the RS485 chip          //
//in Receive mode.                                                                                    //
// The code then waits for the data send by the microcontroller board.When data is rxed,its displayed //
// on the console.                                                                                    //
//----------------------------------------------------------------------------------------------------//
// BaudRate     -> 9600                                                                               //
// Data formt   -> 8 databits,No parity,1 Stop bit (8N1)                                              //
// Flow Control -> None                                                                               //
//----------------------------------------------------------------------------------------------------//
// www.xanthium.in										                                              //
// Copyright (C) 2020 Rahul.S                                                                         //
//====================================================================================================//

//====================================================================================================//
// Supported USB to RS485 Models (www.xanthium.in)                                                    // 
// 1)     USB2RS485 V2.2    - Basic USB to RS485 Converter [FT232RL + MAX485] based                   //
// 2) ISO-USB2SERIAL V2.1   - Isolated USB to RS485 Converter                                         //
//====================================================================================================//


//====================================================================================================//
// Compiler/IDE  :	Microsoft Visual Studio Community 2019                                            //
//               :                                                                                    //
//                                                                                                    //
// Library       :  .NET Framework  4.7                                                               //
// Commands      :                                                                                    //
// OS            :	Windows(Windows 10)                                                               //
// Programmer    :	Rahul.S                                                                           //
// Date	         :	06-July-2020                                                                      //
//====================================================================================================//

//====================================================================================================//
// Sellecting the COM port Number                                                                     //
//----------------------------------------------------------------------------------------------------//
// Use "Device Manager" in Windows to find out the COM Port number allotted to USB2SERIAL converter-  // 
// -in your Computer and substitute in the  MyCOMPort.PortName                                        //
//                                                                                                    //
// for eg:-                                                                                           //
// If your COM port number is COM32 in device manager(will change according to system)                //
// then                                                                                               //
//			MyCOMPort.PortName = "COM32"                                                              //
//====================================================================================================//

using System;
using System.IO.Ports;//namespace containing SerialPort class

namespace USB2SERIAL_RS485_Read
{
    class RS485_Read
    {
        static void Main(string[] args)
        {
            string COMPortName;                  // Variable for Holding COM port number ,eg:- COM23
            string RxedData;                     // Variable for Holding received data
            int Baudrate;                        // Variable for holding the Baudrate

            Menu();                              // Used for displaying the banner

            Console.Write("\t  Enter COM Port Number(eg :- COM32) ->");
            COMPortName = Console.ReadLine();     //Store COM number in COMPortName

            COMPortName = COMPortName.Trim();     // Remove any trailing whitespaces
            COMPortName = COMPortName.ToUpper();  // Convert the string to upper case

            Console.Write("\t  Enter Baudrate (eg :- 9600) ->");
            Baudrate = Convert.ToInt32(Console.ReadLine());     //Convert character to int32 and store baudrate value from user

            COMPortName = COMPortName.Trim();     // Remove any trailing whitespaces

            SerialPort COMPort = new SerialPort();// Create a SerialPort Object called COMPort

            COMPort.PortName = COMPortName;       // Assign the COM port number
            COMPort.BaudRate = Baudrate;          // Set Baud rate entered by the user
            COMPort.DataBits = 8;                 // Number of data bits = 8
            COMPort.Parity   = Parity.None;       // No parity
            COMPort.StopBits = StopBits.One;      // One stop bit

            Console.WriteLine();
            Console.WriteLine("\t  {0} Selected  \n",COMPortName);
            Console.WriteLine("\t  Baud rate = {0}",COMPort.BaudRate);
            Console.WriteLine("\t  Data Bits = {0}",COMPort.DataBits);
            Console.WriteLine("\t  Parity    = {0}",COMPort.Parity);
            Console.WriteLine("\t  Stop Bits = {0}",COMPort.StopBits);
            
            // Try Opening the Serialport to receive data from Microcontroller
            try
            {
                COMPort.Open();                       // Open the serial port
                Console.WriteLine("\n\t  {0} opened \n", COMPortName);
            }
            catch(Exception e)
            {
                Console.WriteLine("\n\t  {0} Cannot be opened \n", COMPortName);
                Console.WriteLine("\n\t  An Exception has Ocurred \n");
                //Console.WriteLine("\n\t  {0}", e.ToString()); //un comment this line to view the error message
                COMPort.Close(); //close the com port
                Menu_End(); 
                Environment.Exit(0); // exit the program
            }
            

            COMPort.RtsEnable = true;            // Since RTS = 1, ~RTS = 0 So ~RE = 0 Receive  Mode enabled
            COMPort.DtrEnable = true;            // Since DTR = 1. ~DTR = 0 So  DE = 0 
                                                 //~RE and DE LED's on USB2SERIAL board will be off

            Console.WriteLine("\t  RTS = 1 so ~RTS = 0, ~RE = 0 Receive  Mode enabled");
            Console.WriteLine("\t  DTR = 1 so ~DTR = 0,  DE = 0 ");
           
            //Continously read data,you will have to close program window to exit.
            //removing the while(true) statement will make the program read data only once
            while (true)
            {
                RxedData = COMPort.ReadLine();       // Wait for data reception

                //Console.WriteLine("\n\t  Data Received ");
                Console.WriteLine("\n\t {0}", RxedData);
            }
           
            Menu_End();
           
        }//end of Main

        static void Menu()
        {
            Console.Clear();//Clear the console Window 
            Console.WriteLine();
            Console.WriteLine("\t+---------------------------------------------------+");
            Console.WriteLine("\t|           USB2RS485/SERIAL RS485 Read             |");
            Console.WriteLine("\t|               (c) www.xanthium.in                 |");
            Console.WriteLine("\t+---------------------------------------------------+");
        }//End of Menu()

        static void Menu_End()
        {
            Console.WriteLine("\n\t+---------------------------------------------------+");
            Console.WriteLine("\t|            Press Any Key to Exit                  |");
            Console.WriteLine("\t+---------------------------------------------------+");
            Console.Read();                       // Press to Exit
        }//End of Menu_End()

    }//end of Class RS485_Read
}//end of namespace USB2SERIAL_RS485_Read
