import csv
import time
from datetime import datetime
from opentrons.protocol_api import ProtocolContext
from hardware_testing.drivers.stacker import flex_stacker_driver

metadata = {"protocolName": "Flex Stacker TempDeck Gripper Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

STACKER_HEIGHT = 30
CYCLES = 10
TD_TIME = 5*60 # seconds
TD_HEAT = False
if TD_HEAT:
    TD_TEMP = 95
else:
    TD_TEMP = 4

# Define Spreadsheet Parameters
test_name = "stacker_tempdeck_gripper_test"
test_tag = f"_temp{TD_TEMP}_hold{int(TD_TIME/60)}"
test_time = datetime.utcnow().strftime("%y-%m-%d-%H-%M-%S")
test_id = f"_run-{test_time}"
file_format = ".csv"
file_name = test_name + test_tag + test_id + file_format
file_folder = "/data/testing_data/stacker_tempdeck_gripper_test/"
file_path = file_folder + file_name
file_header = ["Time","Cycle","Stacker ID","Stacker State","Temp","Hold Time"]

labware = "armadillo_96_wellplate_200ul_pcr_full_skirt"
labware_height = flex_stacker_driver.LABWARE_Z_HEIGHT.BIORAD_HARDSHELL_PCR

def run(protocol: ProtocolContext) -> None:
    # Record Test Data
    def record_data(cycle, stacker_id, stacker_state):
        print(f"Cycle: {cycle}, Stacker: {stacker_id}, State: {stacker_state}")
        print("Recording...")
        if not protocol.is_simulating():
            elapsed_time = (time.time() - start_time)/60
            timestamp = round(elapsed_time, 3)
            temp = TD_TEMP
            hold_time = int(TD_TIME/60)
            test_data = [timestamp, cycle, stacker_id, stacker_state, temp, hold_time]
            with open(file_path, 'a+') as f:
                writer = csv.writer(f)
                writer.writerow(test_data)

    # Create Spreadsheet
    if not protocol.is_simulating():
        with open(file_path, 'a+') as f:
            writer = csv.writer(f)
            writer.writerow(file_header)

    # Protocol Setup
    hardware = protocol._hw_manager.hardware
    hardware.cache_instruments()
    temp_deck_1 = protocol.load_module("temperatureModuleV2", "C3")
    temp_deck_2 = protocol.load_module("temperatureModuleV2", "A3")
    stacker_platform_1 = "D3"
    stacker_platform_2 = "B3"
    stacker_plate_1 = protocol.load_labware(labware, stacker_platform_1)
    stacker_plate_2 = protocol.load_labware(labware, stacker_platform_2)
    if not protocol.is_simulating():
        f_stacker_1 = flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM1')
        f_stacker_2 = flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM2')

    # Protocol Run
    start_time = time.time()
    for i in range(CYCLES):
        cycle = i + 1
        print(f"Starting Test Cycle: {cycle}/{CYCLES}")
        protocol.delay(5)
        # Unload Labware
        if not protocol.is_simulating():
            f_stacker_1.unload_labware(labware_height)
            record_data(cycle, 1, "Unloaded")
            f_stacker_2.unload_labware(labware_height)
            record_data(cycle, 2, "Unloaded")
        protocol.move_labware(stacker_plate_1, temp_deck_1,
                                use_gripper=True,
                                pick_up_offset={"x": 162, "y": 0, "z": STACKER_HEIGHT})
        protocol.move_labware(stacker_plate_2, temp_deck_2,
                                use_gripper=True,
                                pick_up_offset={"x": 162, "y": 0, "z": STACKER_HEIGHT})
        protocol.delay(TD_TIME)
        # x = -3, z = 12
        # Load Labware
        protocol.move_labware(stacker_plate_1, stacker_platform_1,
                                use_gripper=True,
                                drop_offset={"x": 162, "y": 0, "z": STACKER_HEIGHT})
        protocol.move_labware(stacker_plate_2, stacker_platform_2,
                                use_gripper=True,
                                drop_offset={"x": 162, "y": 0, "z": STACKER_HEIGHT})
        if not protocol.is_simulating():
            f_stacker_1.load_labware(labware_height)
            record_data(cycle, 1, "Loaded")
            f_stacker_2.load_labware(labware_height)
            record_data(cycle, 2, "Loaded")
