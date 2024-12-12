from opentrons.protocol_api import ProtocolContext
from hardware_testing.drivers.stacker import flex_stacker_driver

metadata = {"protocolName": "Flex Stacker Multiple Axis Accelerated Lifetime Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

CYCLES = 5000
NUM_STACKER = 4

labware_height = flex_stacker_driver.LABWARE_Z_HEIGHT.OPENTRONS_TIPRACKS
f_stacker = []

def run(protocol: ProtocolContext) -> None:
    if not protocol.is_simulating():
        for i in range(NUM_STACKER):
            f_stacker.append(flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM'+str(i+1)))
    for i in range(CYCLES):
        print(f"\nCycle: #{i+1}:")
        # Unload Labware
        if not protocol.is_simulating():
            print(f"-> Unloading Labware...")
            for stacker in f_stacker:
                stacker.unload_labware(labware_height)
        # Load Labware
        if not protocol.is_simulating():
            print(f"<- Loading Labware...")
            for stacker in f_stacker:
                stacker.load_labware(labware_height)
