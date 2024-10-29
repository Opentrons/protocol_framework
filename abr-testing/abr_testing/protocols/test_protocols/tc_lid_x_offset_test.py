"""Protocol to Test the Stacking and Movement of Tough Auto Seal Lid."""
from typing import List, Union
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
    Labware,
)
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
)
from abr_testing.protocols import helpers


metadata = {"protocolName": "Flat and Stacked Offset TC Lid Testing"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="lids_in_a_stack",
        display_name="Num of Lids in Stack",
        minimum = 1,
        maximum = 5,
        default = 1
    )
    parameters.add_float(
        variable_name = "x_offset",
        display_name= "X Offset",
        choices=[
            {"display_name": "-1.4", "value": -1.4},
            {"display_name": "-1.3", "value": -1.3},
            {"display_name": "-1.2", "value": -1.2},
            {"display_name": "-1.1", "value": -1.1},
            {"display_name": "-1", "value": -1},
            {"display_name": "-0.9", "value": -0.9},
            {"display_name": "-0.8", "value": -0.8},
            {"display_name": "-0.7", "value": -0.7},
            {"display_name": "-0.6", "value": -0.6},
            {"display_name": "-0.5", "value": -0.5},
            {"display_name": "-0.4", "value": -0.4},
            {"display_name": "-0.3", "value": -0.3},
            {"display_name": "-0.2", "value": -0.2},
            {"display_name": "-0.1", "value": -0.1},
            {"display_name": "0.0", "value": 0.0},
            {"display_name": "-0.1", "value": 0.1},
            {"display_name": "-0.1", "value": 0.2},
            {"display_name": "-0.1", "value": 0.3},
            {"display_name": "-0.1", "value": 0.4},
            {"display_name": "-0.1", "value": 0.5},
            {"display_name": "1.5", "value": 1.5},
            {"display_name": "1.6", "value": 1.6},
            {"display_name": "1.7", "value": 1.7},
            {"display_name": "1.8", "value": 1.8},
        ],
        default = 0.0
    )

def run(protocol: ProtocolContext) -> None:
    """Runs protocol that moves lids and stacks them."""
    # Load Parameters
    lids_in_stack = protocol.params.lids_in_a_stack  # type: ignore[attr-defined]
    x_offset = protocol.params.x_offset # type: ignore[attr-defined]
    # Thermocycler
    thermocycler: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2"
    )  # type: ignore[assignment]
    plate_in_cycler = thermocycler.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt"
    )
    thermocycler.open_lid()
    # Load Lids
    if lids_in_stack == 1:
        slot_locations = ["D2", "C2", "B2", "C3", "B3"]
    else:
        slot_locations = ["D2"]
    lids = helpers.load_disposable_lids(protocol, lids_in_stack, slot_locations)
    drop_offset = {"x": x_offset, "y": 0, "z": 0}
    slot = 0
    for lid in lids:
        protocol.comment(
            f"Offset {x_offset}, Lid # {slot+1}"
        )
        # move lid to plate in thermocycler
        protocol.move_labware(
            lid, plate_in_cycler, use_gripper=True, drop_offset=drop_offset
        )
        
        if slot == 0:
            move_location = "C1"
        else:
            move_location = prev_moved_lid
        
        protocol.move_labware(lid, move_location, use_gripper=True)
        slot +=1
        prev_moved_lid = lid
    
