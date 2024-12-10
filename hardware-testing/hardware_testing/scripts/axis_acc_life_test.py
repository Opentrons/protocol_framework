from opentrons.protocol_api import ProtocolContext
from hardware_testing.drivers.stacker import flex_stacker_driver

metadata = {"protocolName": "Flex Stacker Axis Acc Life Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

CYCLES = 3000
STACKER_HEIGHT = 30

UNLOAD_CLEARANCE = 60
# TIPRACK = 60

LABWARE_Z_OFFSET = 102
# TIPRACK = 102

labware_library = {
    1:"opentrons_flex_96_tiprack_50ul",
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

labware = labware_library[1]

def run(protocol: ProtocolContext) -> None:
    if not protocol.is_simulating():
        f_stacker = flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM1')
    for i in range(CYCLES):
        print(f"\nCycle: #{i+1}:")
        # Unload Labware
        if not protocol.is_simulating():
            print(f"-> Unloading Labware...")
            f_stacker.unload_labware(UNLOAD_CLEARANCE)
        # Load Labware
        if not protocol.is_simulating():
            print(f"<- Loading Labware...")
            f_stacker.load_labware(LABWARE_Z_OFFSET)
