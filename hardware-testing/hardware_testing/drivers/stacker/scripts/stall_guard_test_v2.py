import os, sys
import asyncio
import csv
from hardware_testing.drivers import mark10
import threading
import argparse
import time

from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction, LEDColor, LEDPattern
from opentrons.drivers.flex_stacker.driver import (
    STACKER_MOTION_CONFIG,
    STALLGUARD_CONFIG,
    FlexStackerDriver,
)

class Timer:
    def __init__(self):
        self._start_time = None
        self._elasped_time = None

    def start(self):
        """Start a new timer"""
        self._start_time = time.perf_counter()

    def elasped_time(self):
        """report the elapsed time"""
        self._elasped_time = time.perf_counter() - self._start_time
        return self._elasped_time

    def stop_time(self):
        if self._start_time is None:
            raise TimerError(f"Timer is not running. Use .start() to start it")
        stop_time = time.perf_counter()

async def force_func(fg_var, sg_value, trial, axis, timer):
    timer.start()
    t = timer.elasped_time()
    dir = '/data/stallguard/'
    speed = STACKER_MOTION_CONFIG[axis]['move'].max_speed
    current = STACKER_MOTION_CONFIG[axis]['move'].current
    file_name = f'{axis}_SG_val_{sg_value}_Speed_{speed}_{current}_Amps.csv'
    with open(dir + file_name, 'a', newline = '') as file:
        writer = csv.writer(file)
        if trial == 1:
            fields = ["Time(s)", "Force(N)", "SG Value", "Trials"]
            writer.writerow(fields)
        while t < 5:
            t = timer.elasped_time()
            fg_reading = await fg_var.read_force()
            data = [t, fg_reading, sg_value, trial]
            writer.writerow(data)
            print(data)
            file.flush()
        file.close()

async def move(s, a, d, d_2):
    try:
        print(f'I am Moving')
        await s.move_axis(axis = a,
                            direction = d, distance = d_2)
        print(f'Finished')
    except Exception as e:
        raise(e)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 4, type = int, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = 'x', type = str, help = "Choose a Axis")
    # arg_parser.add_argument("-f", "--force_gauge", default = True, help = "Force gauge")
    return arg_parser

async def main(args) -> None:

    t = Timer()
    if args.axis.lower() == 'x':
        TOTAL_TRAVEL = 202
        test_axis = StackerAxis.X
    elif args.axis.lower() == 'z':
        TOTAL_TRAVEL = 202
        test_axis = StackerAxis.Z
    elif args.axis.lower() == 'l':
        test_axis = StackerAxis.L
    else:
        raise("Axis not recognized from args options")
    sg_start = -4
    sg_final = 12
    print(f'config: {STACKER_MOTION_CONFIG}')
    # api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating = False)
    api = await OT3API.build_hardware_controller(loop=asyncio.get_running_loop())
    force_gauge = await mark10.Mark10.create('/dev/ttyUSB0', 115200, loop=asyncio.get_running_loop())
    stacker = api.attached_modules[0]
    device_info = api.attached_modules[0].device_info
    # sg_value = int(input("Enter SG Value: "))
    # await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
    await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    await stacker.close_latch()
    await stacker.open_latch()
    stallguard_vals = [x for x in range(sg_start, sg_final+1)]
    for sg_value in stallguard_vals:
        for c in range(1, args.cycles+1):
            await stacker._driver.set_stallguard_threshold(test_axis, True, sg_value)
            move_task = asyncio.create_task(move(stacker, test_axis, Direction.EXTEND, TOTAL_TRAVEL))
            fg_task = asyncio.create_task(force_func(force_gauge, sg_value, c, test_axis, t))
            print(f"Cycle: {c}")
            try:
                await asyncio.gather(move_task, fg_task)
            except Exception as e:
                print(e)
            await asyncio.sleep(1)
            await stacker._driver.set_stallguard_threshold(test_axis, False, sg_value)
            await stacker.home_axis(test_axis, Direction.RETRACT)
            await stacker._driver.set_stallguard_threshold(test_axis, True, sg_value)


if __name__ == '__main__':
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    t = Timer()
    asyncio.run(main(options))
