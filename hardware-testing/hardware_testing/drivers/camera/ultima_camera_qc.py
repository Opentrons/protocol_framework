import sys
import serial
import serial.tools.list_ports
import asyncio


EXPECTED_LOCATION = "1-1.2" # If connected to rear panel board J12, location will be "1-1.2"
CAMERA_COMMAND = "OFFLINE\n"
EXPECTED_RESPONSE = b'!OK' # Response to 'OFFLINE' Command


class OmronMircoscanCamera:
    """""Class to control Omron Microscan Camera."""
    def __init__(self, port, baudrate=115200):
        self.port = port
        self.baudrate = baudrate
        self.serialPort = None
        self.is_connected = False

    def scan_ports(self):
        """Scan for available ports and return the port of the barcode scanner."""
        barcode_scanner_port = None 
        ports = serial.tools.list_ports.comports()
        for port, desc, hwid in ports:
            print(f"{port}: {desc} [{hwid}]")
            location = hwid.split("LOCATION=",1)[1]
            if location == EXPECTED_LOCATION:
                print (f"Found {desc} at {port}.")
                barcode_scanner_port = port
        return barcode_scanner_port
                
    async def connect(self):
        """Connect to the camera."""
        try:
            self.port = self.scan_ports()
            if self.port is None:
                print("No camera found.")
                self.is_connected = False
                raise Exception("No camera found.")
            self.serialPort = serial.Serial(self.port, self.baudrate, timeout=2)
            self.is_connected = True
            print(f"Connected to {self.port}")
        except Exception as e:
            print(f"Error connecting to {self.port}: {e}")
            self.is_connected = False
            raise Exception(f"Error connecting to {self.port}: {e}")
    
    async def disconnect(self):
        """Disconnect from the camera."""
        if self.is_connected:
            self.serialPort.close()
            self.is_connected = False
            print(f"Disconnected from {self.port}")
        else:
            print("Not connected to camera.")

    async def check_camera_communication(self):
        """Check camera communication."""
        self.serialPort.reset_input_buffer()
        x = self.serialPort.write(CAMERA_COMMAND.encode())
        s = self.serialPort.read(10000)
        print(s)
        if (s == EXPECTED_RESPONSE):
            print("Camera communication successful.")
        else:
            print("CAMERA COMMUNICATION FAILED!!!")
            self.serialPort.close()
        return s
    
if __name__ == '__main__':
    camera = OmronMircoscanCamera(port=None)
    try:
        asyncio.run(camera.connect())
        asyncio.run(camera.check_camera_communication())
        asyncio.run(camera.disconnect())
    except Exception as e:
        print(f"Error: {e}")
