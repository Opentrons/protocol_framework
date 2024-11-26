"""
@description: high accuracy laser sensor
"""

import codecs
import time

from .driver import SerialDriver

MEASURE_CODE = bytes.fromhex("024D45415355524503")
LOW_MEASURE_CODE = "GetVolt"
GET_MOUNT = 'GetMount'
COM = 'COM9'


class LaserSensor:
    def __init__(self, send=True):
        self.serial = SerialDriver()
        self.send = send
        self.accuracy = "low"

    def init_device(self, select_default=''):
        """
        get device
        :return:
        """
        if self.accuracy == "high":
            self.serial.init(115200, select_default=select_default)
        else:
            self.serial.init(9600, select_default=select_default)

    def close(self):
        self.serial.close()

    def get_mount(self):
        for _i in range(5):
            result = self.serial.write_and_get_buffer(GET_MOUNT, delay=3)
            if "ADS1115" in str(result):
                continue
            if "L" in str(result).upper():
                return "left"
            elif "R" in str(result).upper():
                return 'right'
            else:
                pass
        raise ValueError("Failed to find mount")

    def read_sensor_high(self):
        result = self.serial.write_and_get_buffer(MEASURE_CODE)
        data = codecs.encode(result, 'hex')
        if len(data) <= 0:
            raise ValueError("Read Sensor Fail")
        data = data.decode('utf-8')
        # analyze data
        _bai = int(data[3:4])
        _shi = int(data[5:6])
        _wei = int(data[7:8])
        primary_value = _bai * 100 + _shi * 10 + _wei
        _qian = int(data[11:12])
        _bai = int(data[13:14])
        _shi = int(data[15:16])
        _wei = int(data[17:18])
        secondary_value = _qian * 0.1 + _bai * 0.01 + _shi * 0.001 + _wei * 0.0001
        value = primary_value + secondary_value
        return value

    def read_sensor_low(self, show_distance=False):
        multi_value = {}
        result = self.serial.write_and_get_buffer(LOW_MEASURE_CODE)
        result = result.decode('utf-8')
        for index, item in enumerate(result.split(',')):
            if ":" not in item:
                continue
            _value = float(item.split(':')[1].strip()) / 1000
            _value = round(_value, 3)
            if show_distance:
                _value = round(-2 * _value + 35, 3)
            multi_value.update({index: _value})
        return multi_value


if __name__ == '__main__':
    ls = LaserSensor()
    ls.init_device()

    # mount = ls.get_mount()
    # print(f"Mount: {mount}")
    # while True:
    #     res = ls.read_sensor_low(show_distance=True)
    #     print(f"Distance: {res}")
    #     time.sleep(1)
    while True:
        res = ls.read_sensor_low(show_distance=True)
        print(res)
