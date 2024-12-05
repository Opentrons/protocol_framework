import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
from stacker import LABWARE_Z_HEIGHT
import time
import argparse



def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 20, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--axis", default = AXIS.X, help = "Choose a Axis")
    arg_parser.add_argument("-l", "--labware", default = 13, type = str,  help = "number of cycles to execute")
    # arg_parser.add_argument("-")
    return arg_parser


if __name__ == '__main__':
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    labware_library = {
    '1': LABWARE_Z_HEIGHT.BIORAD_HARDSHELL_PCR, # 48 plates
    '2': LABWARE_Z_HEIGHT.OPENTRONS_TIPRACKS, # 6 plates
    '3': LABWARE_Z_HEIGHT.DEEPWELL_96, # 16 plates
    '4': LABWARE_Z_HEIGHT.FLEX_STACKER_PLATFORM,
    '5': LABWARE_Z_HEIGHT.NEST_200_ul_PCR_PLATE, # 53 plates
    '6': LABWARE_Z_HEIGHT.NEST_96_WELL_PLATE_FLATBOTTOM, # 48 plates
    '7': LABWARE_Z_HEIGHT.NEST_96_WELL_PLATE_FLATBOTTOM_WITH_LID,
    '8': LABWARE_Z_HEIGHT.NEST_96_DEEP_WELL_PLATE_VBOTTOM, # 16 plates
    '9': LABWARE_Z_HEIGHT.NEST_12_DEEP_WEEL_PLATE_VBOTTOM, # 16 plates
    '10': LABWARE_Z_HEIGHT.CORSTAR_24_WELL_WITH_LID,
    '11': LABWARE_Z_HEIGHT.CORSTAR_24_WELL_WITHOUT_LID, # 32 plates
    '12': LABWARE_Z_HEIGHT.SARSTEDT_PCR_PLATE_FULLSKIRT,
    '13': LABWARE_Z_HEIGHT.ARMADILLO_384_PLATE
    }
    print(labware_library[str(options.labware)].value)
    num_loaded_labware = 48
    s = stacker.FlexStacker(None).create('COM12')
    labware = labware_library[str(options.labware)]
    if labware == labware_library['2']:
        labware_height = labware_library['2'] + 10
    else:
        labware_height = labware
    # s.close_latch()
    for cycle in range(1, num_loaded_labware+1):
        # s.unload_labware(labware_height)
        s.load_labware(labware_height)
        input("Remove Labware")
        # s.load_labware(labware_height)
