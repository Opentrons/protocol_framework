from typing import cast
from opentrons import protocol_api
from opentrons.protocol_api.module_contexts import AbsorbanceReaderContext

from opentrons import protocol_api
from opentrons.protocol_api import SINGLE, ALL

requirements = {"robotType": "Flex", "apiLevel": "2.21"}
metadata = {"protocolName": "plate_reader wrong plate"}


def run(protocol: protocol_api.ProtocolContext):
    partial_rack = protocol.load_labware(load_name="opentrons_flex_96_tiprack_1000ul", location="D2")
    trash = protocol.load_trash_bin("A3")
    instrument = protocol.load_instrument(instrument_name="flex_8channel_1000", mount="right")
    instrument.configure_nozzle_layout(style=SINGLE, start="H1", tip_racks=[partial_rack])

    plate_1 = protocol.load_labware("thermoscientificnunc_96_wellplate_2000ul", "C2")

    mod = protocol.load_module("absorbanceReaderV1", "B3")

    mod.open_lid()
    protocol.move_labware(plate_1, mod, use_gripper=True)
    protocol.move_labware(plate_1, trash, use_gripper=True)