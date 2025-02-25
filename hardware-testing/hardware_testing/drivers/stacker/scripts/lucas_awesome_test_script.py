from opentrons.protocol_api import ProtocolContext
from hardware_testing.drivers.stacker import flex_stacker_driver
from hardware_testing.drivers.stacker.flex_stacker_driver import LABWARE_Z_HEIGHT, AXIS, DIR
from hardware_testing import data
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons import types as top_types
import csv
import threading
import serial.tools.list_ports
import time
from datetime import datetime

metadata = {"protocolName": "Flex Stacker Lifetime Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

labware_library = {
    1:"opentrons_flex_96_tiprack_1000ul",
    2:"armadillo_96_wellplate_200ul_pcr_full_skirt",
    3:"biorad_384_wellplate_50ul", # armadillo_384
    4:"biorad_96_wellplate_200ul_pcr",
    5:"nest_12_reservoir_15ml",
    6:"nest_96_wellplate_2ml_deep",
    7:"nest_96_wellplate_100ul_pcr_full_skirt",
    8:"nest_96_wellplate_200ul_flat",
    9:"corning_12_wellplate_6.9ml_flat",
    10:"corning_24_wellplate_3.4ml_flat",
    11:"corning_96_wellplate_360ul_flat",
}


labware_height = LABWARE_Z_HEIGHT.NEST_200_ul_PCR_PLATE
labware = labware_library[2]
deck_slots = ["C1", "C2", "C3","D1", "D2", "D3"]
load_order = ["D3", "D2", "D1", "C3", "C2", "C1"]
# deck_slots = ["D1"]
cycles = 1
STACKER_HEIGHT = 12

# For data retrieval
motion_parameters = []

def unload_labware(stacker):
    try:
        stacker.unload_labware(labware_height)
    except Exception as e:
        raise(e)

def load_labware(stacker):
    try:
        stacker.load_labware(labware_height)
    except Exception as e:
        raise(e)

def scan_for_stackers():
    port_list = []
    ports = serial.tools.list_ports.comports()
    for port, desc, hwid in sorted(ports):
        port_list.append(port)
        print("{}: {} [{}]".format(port, desc, hwid))
    port_list.pop(0)
    print(f"ports: {port_list}")
    return port_list

def run(protocol: ProtocolContext) -> None:
    hardware = protocol._hw_manager.hardware
    hardware.cache_instruments()
    gripper_instr = OT3Mount.GRIPPER
    stacker_platform_4 = "D4"
    labware_deck_slot = "D2"
    #Scan for ports automatically and assign them a variable
    # Based on how many ports are found, create that amount of variables
    ports = scan_for_stackers()
    try:
        stacker_num = 0
        stackers = []
        SNs = []
        for s in ports:
            stacker_num += 1
            globals()[f'f_stacker_{stacker_num}'] = flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM0')
            # globals()[f'f_stacker_{stacker_num}'].setup_stall_detection()
            globals()[f'f_stacker_{stacker_num}'].home(AXIS.X, DIR.POSITIVE_HOME)
            # SNs.append(globals()[f'f_stacker_{stacker_num}'].get_device_serial_number())
            stackers.append(globals()[f'f_stacker_{stacker_num}'])
        print("Stackers enabled")
        print(f'Number of Cycles to be Completed :{cycles}')
        num_plates = 1
        ##f_stacker_1.load_labware(labware_height)
        while True:
            for plates in range(1, num_plates+1):
                plate_1 = protocol.load_labware(labware, stacker_platform_4)
                protocol.move_labware(plate_1, labware_deck_slot,
                                            use_gripper=True,
                                            pick_up_offset={"x": -3.0, "y": 0, "z": STACKER_HEIGHT},
                                            drop_offset = {"x": 0.0, "y": 0, "z": -3})
                del protocol.deck['D4']
                del protocol.deck['D2']
                input("Press Enter to Continue")
    except Exception as e:
        print(e)
    finally:
        print("Test Completed")
