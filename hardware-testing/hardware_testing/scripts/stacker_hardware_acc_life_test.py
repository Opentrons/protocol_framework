"""Flex Stacker Axis Accelerated Lifetime Test."""
import argparse
import asyncio
import csv
import os
import sys
import time
import threading
from datetime import datetime

from hardware_testing import data
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.opentrons_api.types import OT3Mount, Axis
from hardware_testing.opentrons_api.helpers_ot3 import build_async_ot3_hardware_api
from hardware_testing.drivers.stacker import flex_stacker_driver

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Flex Stacker Axis Accelerated Lifetime Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Sets the number of testing cycles', default=100)
    arg_parser.add_argument('-n', '--num_stacker', type=int, required=False, help='Sets the number of Flex Stackers', default=1)
    arg_parser.add_argument('-m', '--mode', choices=['sequential','parallel'], required=False, help='Sets the test mode for either sequential or parallel', default='sequential')
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Stacker_Axis_Acc_Lifetime_Test:
    def __init__(
        self, simulate: bool, cycles: int, num_stacker: int, mode: str
    ) -> None:
        self.simulate = simulate
        self.cycles = cycles
        self.num_stacker = num_stacker
        self.mode = mode
        self.api = None
        self.mount = None
        self.home = None
        self.stackers = []
        self.test_files = []
        self.serial_port_name = "/dev/ttyACM"
        self.labware_height = flex_stacker_driver.LABWARE_Z_HEIGHT.OPENTRONS_TIPRACKS
        self.axes = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
        self.test_data = {
            "Cycle":"None",
            "Gripper":"None",
            "Stacker":"None",
            "State":"None",
            "XE":"None",
            "XR":"None",
            "ZE":"None",
            "ZR":"None",
            "LR":"None",
        }

    async def test_setup(self):
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        await self.stacker_setup()
        await self.gripper_setup()
        self.file_setup()
        print(f"\n-> Starting Stacker Test!\n")
        self.start_time = time.time()

    async def stacker_setup(self):
        for i in range(self.num_stacker):
            self.stackers.append(flex_stacker_driver.FlexStacker(None).create(self.serial_port_name+str(i+1)))

    async def gripper_setup(self):
        await self.api.cache_instruments()
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_date = "run-" + datetime.utcnow().strftime("%y-%m-%d")
        self.test_path = data.create_folder_for_test_data(self.test_name)
        print("FILE PATH = ", self.test_path)
        for stacker in self.stackers:
            serial_number = stacker.get_device_serial_number()
            self.test_tag = f"cycles{self.cycles}_{self.mode}_{serial_number}"
            test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
            self.test_files.append(test_file)
            data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=self.test_header)
            print("FILE NAME = ", test_file)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def run_threading(self, cycle):
        # # Define threads
        stackerA_thread = threading.Thread(target = self.move_stackerA, args = (cycle, self.stackers[0], self.test_files[0],))
        stackerB_thread = threading.Thread(target = self.move_stackerB, args = (cycle, self.stackers[1], self.test_files[1],))
        stackerC_thread = threading.Thread(target = self.move_stackerC, args = (cycle, self.stackers[2], self.test_files[2],))
        stackerD_thread = threading.Thread(target = self.move_stackerD, args = (cycle, self.stackers[3], self.test_files[3],))
        # # Start threads
        stackerA_thread.start()
        stackerB_thread.start()
        stackerC_thread.start()
        stackerD_thread.start()
        # # Join threads
        stackerA_thread.join()
        stackerB_thread.join()
        stackerC_thread.join()
        stackerD_thread.join()

    def move_stackerA(self, cycle, stacker, test_file):
        # stacker.unload_labware(self.labware_height)
        # stacker.load_labware(self.labware_height)

        serial_number = stacker.get_device_serial_number()
        self.test_data["Stacker"] = serial_number

        stacker.unload_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Unloaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

        stacker.load_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Loaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

    def move_stackerB(self, cycle, stacker, test_file):
        # stacker.unload_labware(self.labware_height)
        # stacker.load_labware(self.labware_height)

        serial_number = stacker.get_device_serial_number()
        self.test_data["Stacker"] = serial_number

        stacker.unload_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Unloaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

        stacker.load_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Loaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

    def move_stackerC(self, cycle, stacker, test_file):
        # stacker.unload_labware(self.labware_height)
        # stacker.load_labware(self.labware_height)

        serial_number = stacker.get_device_serial_number()
        self.test_data["Stacker"] = serial_number

        stacker.unload_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Unloaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

        stacker.load_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Loaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

    def move_stackerD(self, cycle, stacker, test_file):
        # stacker.unload_labware(self.labware_height)
        # stacker.load_labware(self.labware_height)

        serial_number = stacker.get_device_serial_number()
        self.test_data["Stacker"] = serial_number

        stacker.unload_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Unloaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

        stacker.load_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Loaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=test_file, data=test_data)

    def move_stacker(self, stacker):
        serial_number = stacker.get_device_serial_number()
        self.test_data["Stacker"] = serial_number

        # Unload Labware
        stacker.unload_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Unloaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        for file in self.test_files:
            if serial_number in file:
                data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=file, data=test_data)

        # Load Labware
        stacker.load_labware(self.labware_height)
        sensor_states = stacker.get_sensor_states()
        stacker_state = "Unloaded"
        self.test_data["Cycle"] = str(cycle)
        self.test_data["State"] = stacker_state
        self.test_data.update(sensor_states)
        test_data = self.dict_values_to_line(self.test_data)
        for file in self.test_files:
            if serial_number in file:
                data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=file, data=test_data)

    async def _stacker_mode(self, cycle):
        # Sequential Mode
        if self.mode == "sequential":
            for stacker in self.stackers:
                print(f"-> Unloading Labware...")
                stacker.unload_labware(self.labware_height)
                serial_number = stacker.get_device_serial_number()
                sensor_states = stacker.get_sensor_states()
                stacker_state = "Unloaded"
                self.test_data["Cycle"] = str(cycle)
                self.test_data["Stacker"] = serial_number
                self.test_data["State"] = stacker_state
                self.test_data.update(sensor_states)
                test_data = self.dict_values_to_line(self.test_data)
                for file in self.test_files:
                    if serial_number in file:
                        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=file, data=test_data)

            for stacker in self.stackers:
                print(f"-> Loading Labware...")
                stacker.load_labware(self.labware_height)
                serial_number = stacker.get_device_serial_number()
                sensor_states = stacker.get_sensor_states()
                stacker_state = "Loaded"
                self.test_data["Cycle"] = str(cycle)
                self.test_data["Stacker"] = serial_number
                self.test_data["State"] = stacker_state
                self.test_data.update(sensor_states)
                test_data = self.dict_values_to_line(self.test_data)
                for file in self.test_files:
                    if serial_number in file:
                        data.append_data_to_file(test_name=self.test_name, run_id=self.test_date, file_name=file, data=test_data)
        # Parallel Mode
        else:
            self.run_threading(cycle)

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home()
        self.home = await api.gantry_position(mount)

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                await self._home(self.api, self.mount)
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._stacker_mode(cycle)
        except Exception as e:
            await self.exit()
            raise e
        except KeyboardInterrupt:
            await self.exit()
            print("\nTest Cancelled!")
        finally:
            await self.exit()
            print("\nTest Completed!")

if __name__ == '__main__':
    print("\nFlex Stacker Axis Accelerated Lifetime Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Stacker_Axis_Acc_Lifetime_Test(args.simulate, args.cycles, args.num_stacker, args.mode)
    asyncio.run(test.run())
