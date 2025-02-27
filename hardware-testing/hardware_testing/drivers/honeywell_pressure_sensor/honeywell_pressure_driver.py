import asyncio
import logging
import serial
import time

class HoneywellPressureDriver:
    """Driver for Honeywell pressure sensor."""
    def __init__(self, port):
        self.port = port
        self.is_connected = False
        self.is_reading = False
        self.pressure = 0.0
        self.zero_guage_reading = 0.0

    async def connect(self):
        """Connect to the sensor."""
        try:
            self.sensor = serial.Serial(port=self.port, baudrate=9600)
            self.is_connected = True
            logging.info(f"Connected to {self.port}")
        except Exception as e:
            logging.error(f"Error connecting to {self.port}: {e}")
            self.is_connected = False

    async def disconnect(self):
        """Disconnect from the sensor."""
        if self.is_connected:
            self.sensor.close()
            self.is_connected = False
            logging.info(f"Disconnected from {self.port}")
        else:
            logging.error("Not connected to sensor.")

    async def start_reading(self):
        """Start reading data from the sensor."""
        if not self.is_connected:
            logging.error("Not connected to sensor.")
        if self.is_connected:
            self.is_reading = True
            while self.is_reading:
                try:
                    data = self.sensor.readline().decode('utf-8').strip().split(',')
                    logging.debug(f"Raw data: {data}")
                    if len(data) >= 4:
                        self.pressure = float(data[4])
                        return (self.pressure - self.zero_guage_reading )
                    else:
                        logging.warning(f"Unexpected data format: {line}")
                except Exception as e:
                    logging.error(f"Error reading data: {e}")
        else:
            logging.error("Not connected to sensor.")

    async def stop_reading(self):
        self.is_reading = False
        logging.info("Stopped reading from sensor.")
        
    async def zero_gauge(self, samples: int = 200):
        """Zero the gauge."""
        values = []
        for x in range(samples):
            pressure_reading = await self.start_reading()
            values.append(pressure_reading)
        self.zero_guage_reading = sum(values) / len(values)
        print(f'gauge_zero: {self.zero_guage_reading}')
        

# Example usage
async def main():
    driver = HoneywellPressureDriver('COM13')
    await driver.connect()
    init_time = time.time()
    await driver.zero_gauge()
    while time.time() - init_time < 5:
        pressure = await driver.start_reading()
        print(pressure)
    await driver.disconnect()

if __name__ == '__main__':
    asyncio.run(main())

