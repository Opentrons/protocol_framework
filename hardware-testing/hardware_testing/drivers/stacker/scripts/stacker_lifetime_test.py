from opentrons.protocol_api import ProtocolContext
from hardware_testing.drivers.stacker import flex_stacker_driver

metadata = {"protocolName": "Flex Stacker Lifetime Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

CYCLES = 1
STACKER_HEIGHT = 30
TRASH_HEIGHT = 50
SEAL_HEIGHT = 9
LID_FIXTURE_HEIGHT = 1

TC2_LID_SEAL = False

UNLOAD_CLEARANCE = 60
## Unload Clearances:
# TIPRACK = 60
# ARMADILLO / BIORAD / NEST 96 / FLAT = 10
# DEEP_WELL = 30
# 24_WELL = 15
# 384_WELL = 7
# LID_SEAL = 24

LABWARE_Z_OFFSET = 102
## Load Z Offsets:
# TIPRACK = 102
# ARMADILLO / BIORAD / NEST 96 / FLAT = 16
# DEEP_WELL = 50
# 24_WELL = 30
# 384_WELL = 15

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
deck_slots = ["D3", "D1", "C2", "B3", "B1", "A1"]

def run(protocol: ProtocolContext) -> None:
    hardware = protocol._hw_manager.hardware
    hardware.cache_instruments()
    stacker_platform = "C3"
    stacker_slot = "D3"
    if not protocol.is_simulating():
        f_stacker = flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM1')
        # f_stacker.set_ihold_current(0.5, flex_stacker_driver.AXIS.Z)
        # f_stacker.set_ihold_current(0.6, flex_stacker_driver.AXIS.X)
        # f_stacker.set_run_current(1.5, flex_stacker_driver.AXIS.Z)
    for i in range(CYCLES):
        # Unload Labware
        for j, slot in enumerate(deck_slots):
            print(f"\nCycle: {i+1}, Unload: #{j+1}\n")
            plate = protocol.load_labware(labware, stacker_platform)
            if not protocol.is_simulating():
                f_stacker.unload_labware(UNLOAD_CLEARANCE)
            if TC2_LID_SEAL:
                protocol.move_labware(plate, slot,
                                use_gripper=True,
                                pick_up_offset={"x": 162, "y": -106, "z": STACKER_HEIGHT + SEAL_HEIGHT})
                plate = protocol.load_labware(labware, stacker_platform)
                protocol.move_labware(plate, "A3",
                                use_gripper=True,
                                pick_up_offset={"x": 162, "y": -106, "z": STACKER_HEIGHT + LID_FIXTURE_HEIGHT},
                                drop_offset={"x": 75, "y": 0, "z": TRASH_HEIGHT})
                del protocol.deck["A3"]
            else:
                protocol.move_labware(plate, slot,
                                use_gripper=True,
                                pick_up_offset={"x": 162, "y": -106, "z": STACKER_HEIGHT})
            del protocol.deck[slot]
        # Load Labware
        if not TC2_LID_SEAL:
            for j, slot in enumerate(deck_slots):
                print(f"\nCycle: {i+1}, Load: #{j+1}\n")
                plate = protocol.load_labware(labware, slot)
                protocol.move_labware(plate, stacker_platform,
                                    use_gripper=True,
                                    drop_offset={"x": 162, "y": -106, "z": STACKER_HEIGHT})
                if not protocol.is_simulating():
                    f_stacker.load_labware(LABWARE_Z_OFFSET)
                del protocol.deck[stacker_platform]
