//RS485 communication from ATmega328p microcontroller to PC Tutorial
//Website-> https://www.xanthium.in/atmel-microchip-avr-atmega328p-rs485-communication-with-computer-tutorial-for-beginners

//====================================================================================================//
//   Program to transmit data to the microcontroller (ATmega328p) through RS485 network              //
//====================================================================================================//


//====================================================================================================//
// Program opens a  connection to USB2SERIAL board and configures the RS485 chip in transmit mode.    //
// The code then sends character 'A' to the microcontroller through RS485 network.The Micro controller//
// receives the data and lights up an LED connected to its Port                                       //
//----------------------------------------------------------------------------------------------------//
// BaudRate     -> 9600                                                                               //
// Data formt   -> 8 databits,No parity,1 Stop bit (8N1)                                              //
// Flow Control -> None                                                                               //
//----------------------------------------------------------------------------------------------------//
// www.xanthium.in										                                              //
// Copyright (C) 2015 Rahul.S                                                                         //
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
using System.IO.Ports;   //namespace containing SerialPort class

namespace USB2SERIAL_RS485_Write
{
    class RS485Write
    {
        static void Main(string[] args)
        {
            string COMPortName;                  // Variable for Holding COM port number ,eg:- COM23
            int Baudrate;                        // Variable for holding the Baudrate
            Menu();                              // Used for displaying the banner

            Console.Write("\t  Enter COM Port Number(eg :- COM32) ->");
            COMPortName = Console.ReadLine();     //Store COM number in COMPortName

            COMPortName = COMPortName.Trim();     // Remove any trailing whitespaces
            COMPortName = COMPortName.ToUpper();  // Convert the string to upper case

            Console.Write("\t  Enter Baudrate (eg :- 9600) ->");
            Baudrate = Convert.ToInt32(Console.ReadLine());     //Convert character to int32 and store baudrate value from user

            SerialPort COMPort = new SerialPort();// Create a SerialPort Object called COMPort

            COMPort.PortName = COMPortName;       // Assign the COM port number
            COMPort.BaudRate = Baudrate;           // Set Baud rate decided by user
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
            catch (Exception e)
            {
                Console.WriteLine("\n\t  {0} Cannot be opened \n", COMPortName);
                Console.WriteLine("\n\t  An Exception has Ocurred \n");
                //Console.WriteLine("\n\t  {0}", e.ToString()); //un comment this line to view the error message
                COMPort.Close(); //close the com port
                Menu_End();
                Environment.Exit(0); // exit the program
            }


            COMPort.DtrEnable = false;            // Since DTR = 0.~DTR = 1 So  DE = 1 Transmit Mode enabled
            COMPort.RtsEnable = false;            // Since RTS = 0,~RTS = 1 So ~RE = 1

            Console.WriteLine("\t  DTR = 0 so ~DTR = 1,  DE = 1 Transmit Mode enabled");
            Console.WriteLine("\t  RTS = 0 so ~RTS = 1, ~RE = 1");
            
            
            COMPort.Write("A");                   // Write  "A" to opened serial port
            Console.WriteLine("\n\t  A written to {0} ",COMPortName);
            Console.ReadLine();

            COMPort.Write("B");                   // Write  "B" to opened serial port
            Console.WriteLine("\n\t  B written to {0} ", COMPortName);
            Console.ReadLine();

            COMPort.Write("C");                   // Write  "C" to opened serial port
            Console.WriteLine("\n\t  C written to {0} ", COMPortName);
            Console.ReadLine();

            COMPort.Close();                      // Close the Serial port
            Console.WriteLine("\n\t  {0} Closed", COMPortName);

            Menu_End();                           // Used for displaying the banner
         
        }//End of Main

        static void Menu()
        {
            Console.Clear();//Clear the console Window 
            Console.WriteLine();
            Console.WriteLine("\t+---------------------------------------------------+");
            Console.WriteLine("\t|              USB2RS485/SERIAL RS485 write         |");
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

    }//end of class RS485Write
}//end of namespace USB2SERIAL_RS485_Write
