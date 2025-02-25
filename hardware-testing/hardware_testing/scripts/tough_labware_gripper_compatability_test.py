"""Tough Consumables"""
from opentrons.protocol_api import ProtocolContext
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons import types as top_types

metadata = {"protocolName": "Tough Consumables Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.17"}

deck_slots = ["A1", "A2", "A3",
            "B1", "B2", "B3",
            "C1", "C2", "C3",
            "D1", "D2", "D3"]

starting_deckslot = "A1"
STACKER_HEIGHT = 12

def run(protocol: ProtocolContext) -> None:
    """Run."""
    hardware = protocol._hw_manager.hardware
    hardware.cache_instruments()
    gripper_instr = OT3Mount.GRIPPER
    labware_1 = protocol.load_labware("agilent_1_reservoir_290ml", starting_deckslot)

    for c in deck_slots:
        if c == starting_deckslot:
            pass
        else:
            protocol.move_labware(labware_1, c,
                                        use_gripper=True)
                                        # pick_up_offset={"x": -3.0, "y": 0, "z": STACKER_HEIGHT},
                                        # drop_offset = {"x": -3.0, "y": 0, "z": STACKER_HEIGHT}
