import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
import csv
import time
from typing import Dict
import numpy as np
import argparse
import mark10
import threading
# import dash
# from dash import html
# from dash import dcc
# from dash.dependencies import Input, Output
# import plotly.graph_objs as go
# from numpy import random
# import pandas as pd
# import webbrowser

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

def open_browser():
	webbrowser.open_new("http://localhost:{}".format(web_port))

# app = dash.Dash()
# web_port = 8082

def find_filename(keyword: str):
    for fname in os.listdir(folder):
        #print(fname)
        if keyword in fname:
            #print(fname)
            return fname

def scan_for_files(folder):
    most_recent_file = None
    most_recent_time = 0
    # iterate over the files in the directory using os.scandir
    for entry in os.scandir(folder):
        if entry.is_file():
            # get the modification time of the file using entry.stat().st_mtime_ns
            mod_time = entry.stat().st_mtime_ns
            if mod_time > most_recent_time:
                # update the most recent file and its modification time
                most_recent_file = entry.name
                most_recent_time = mod_time
    return most_recent_file

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 200, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = 'z', help = "Choose a Axis")
    arg_parser.add_argument("-f", "--force_gauge", default = True, help = "Force gauge")
    return arg_parser

def home(axis: AXIS):
    if axis == AXIS.X:
        TOTAL_TRAVEL = 202
        s.home(AXIS.X, DIR.POSITIVE_HOME)
    elif axis == AXIS.Z:
        TOTAL_TRAVEL = 210.75
        s.home(AXIS.Z, DIR.POSITIVE_NEGATIVE)
    elif axis == AXIS.L:
        TOTAL_TRAVEL = 30
        s.home(AXIS.L, DIR.POSITIVE_NEGATIVE)
    else:
        raise("NO AXIS DEFINED!!")

def fg_func(fg_var, sg_value, trial, axis, timer):
    global motion_active
    motion_active = True
    timer.start()
    t = timer.elasped_time()
    with open(f'Axis_{axis}_SG_test_SG_value_{sg_value}_speed_200_0.8Amps_lifetime_unit.csv', 'a', newline ='') as file:
        writer = csv.writer(file)
        if trial == 1:
            fields = ["Time(s)", "Force(N)", "SG Value", "Trials"]
            writer.writerow(fields)
        while motion_active:
            t = timer.elasped_time()
            fg_reading = fg_var.read_force()
            data = [t, fg_reading, sg_value, trial]
            writer.writerow(data)
            file.flush()
        file.close()

if __name__ == '__main__':
    global motion_active
    working_dir = os.getcwd()
    detail_rows = 0
    # folder= working_dir + '/results/'
    # file_name = scan_for_files(folder)
    # datadata = pd.read_csv(folder + file_name, skiprows = detail_rows)
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    t = Timer()
    # Port setup
    s = stacker.FlexStacker(None).create('COM6')
    force_gauge = mark10.Mark10(None).create('COM9')
    force_gauge.connect()
    force_gauge.read_force()
    # determine what axis to test
    if options.axis.lower() == 'x':
        test_axis = AXIS.X
    elif options.axis.lower() == 'z':
        test_axis = AXIS.Z
    elif options.axis.lower() == 'l':
        test_axis = AXIS.L
    # Determine what direction to home first
    if test_axis == AXIS.X:
        direction = DIR.NEGATIVE_HOME
        total_travel = 300
    elif test_axis == AXIS.Z:
        direction = DIR.NEGATIVE_HOME
        total_travel = 203.75
    elif test_axis == AXIS.L:
        direction = DIR.NEGATIVE_HOME
        total_travel = 30
    else:
        raise(f"No AXIS name {test_axis}")
    # Home axis
    sg_value = int(input("Enter SG Value: "))
    for c in range(1, options.cycles):
        time.sleep(1)
        s.enable_SG(test_axis, 0, False)
        s.home(test_axis, direction)
        # sg_value = int(input("Enter SG Value: "))
        s.enable_SG(test_axis, sg_value, True)
        #print(f'SG Value: {s.read_SG_value(test_axis)}')
        # stop_event = threading.Event()

        fg_thread = threading.Thread(target=fg_func,
                                args=(force_gauge, sg_value, c, test_axis,
                                t) )
        fg_thread.start()
        if test_axis == AXIS.X:
            s.move(test_axis, total_travel, DIR.POSITIVE)
        elif test_axis == AXIS.Z:
            s.move(test_axis, total_travel, DIR.POSITIVE)
        elif test_axis == AXIS.L:
            s.move(test_axis, total_travel, DIR.POSITIVE)
        else:
            raise("NO AXIS DEFINIED OR WRONG AXIS DEFINED")
        time.sleep(2)
        motion_active = False
        # stop_event.set()
        fg_thread.join()
    s.enable_SG(test_axis, 0, False)
