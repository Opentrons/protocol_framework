from opentrons.protocol_api import ProtocolContext
from hardware_testing.drivers.stacker import flex_stacker_driver

metadata = {"protocolName": "Flex Stacker Axis Acc Life Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

CYCLES = 5000

labware_height = flex_stacker_driver.LABWARE_Z_HEIGHT.OPENTRONS_TIPRACKS

def run(protocol: ProtocolContext) -> None:
    if not protocol.is_simulating():
        f_stacker = flex_stacker_driver.FlexStacker(None).create('/dev/ttyACM1')
    for i in range(CYCLES):
        print(f"\nCycle: #{i+1}:")
        # Unload Labware
        if not protocol.is_simulating():
            print(f"-> Unloading Labware...")
            f_stacker.unload_labware(labware_height)
        # Load Labware
        if not protocol.is_simulating():
            print(f"<- Loading Labware...")
            f_stacker.load_labware(labware_height)
