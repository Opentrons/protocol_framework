"""Protocol to Test the Stacking and Movement of Tough Auto Seal Lid."""
from opentrons.protocol_api import (
    ParameterContext,
    ProtocolContext,
)
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
)
from abr_testing.protocols import helpers


metadata = {"protocolName": "5 Stack Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="lids_in_a_stack",
        display_name="Num of Lids in Stack",
        minimum=1,
        maximum=5,
        default=5,
    )
    parameters.add_float(
        variable_name="x_offset",
        display_name="X Offset",
        choices=[
            {"display_name": "0.0", "value": 0.0},
            {"display_name": "0.1", "value": 0.1},
            {"display_name": "0.2", "value": 0.2},
            {"display_name": "0.3", "value": 0.3},
            {"display_name": "0.4", "value": 0.4},
            {"display_name": "0.5", "value": 0.5},
            {"display_name": "0.6", "value": 0.6},
            {"display_name": "0.7", "value": 0.7},
            {"display_name": "0.8", "value": 0.8},
            {"display_name": "0.9", "value": 0.9},
            {"display_name": "1.0", "value": 1.0},
            {"display_name": "1.1", "value": 1.1},
            {"display_name": "1.2", "value": 1.2},
            {"display_name": "1.3", "value": 1.3},
            {"display_name": "1.4", "value": 1.4},
            {"display_name": "1.5", "value": 1.5},
            {"display_name": "1.6", "value": 1.6},
            {"display_name": "1.7", "value": 1.7},
            {"display_name": "1.8", "value": 1.8},
            {"display_name": "1.9", "value": 1.9},
            {"display_name": "2", "value": 2},
        ],
        default=2,
    )
    parameters.add_bool(
        variable_name="negative",
        display_name="Negative",
        description="Turn on to make offset negative.",
        default=False,
    )
    helpers.create_disposable_lid_trash_location(parameters)



def run(protocol: ProtocolContext) -> None:
    """Runs protocol that moves lids and stacks them."""
    # Load Parameters
    lids_in_stack = protocol.params.lids_in_a_stack  # type: ignore[attr-defined]
    x_offset = protocol.params.x_offset  # type: ignore[attr-defined]
    negative = protocol.params.negative  # type: ignore[attr-defined]
    trash_lid = protocol.params.trash_lid # type: ignore[attr-defined]
    
    if negative:
        x_offset = x_offset * -1
    # Thermocycler
    thermocycler: ThermocyclerContext = protocol.load_module(
        "thermocyclerModuleV2"
    )  # type: ignore[assignment]
    plate_in_cycler = thermocycler.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt"
    )
    trash_bin = protocol.load_trash_bin("A3")
    thermocycler.open_lid()
    # Load Lids
    lid_stack_1 = helpers.load_disposable_lids(protocol, lids_in_stack, ["D2"])
    lid_stack_2 = helpers.load_disposable_lids(protocol, lids_in_stack, ["C2"])
    lid_stack_3 = helpers.load_disposable_lids(protocol, lids_in_stack, ["B2"])
    lid_stack_4 = helpers.load_disposable_lids(protocol, lids_in_stack, ["C3"])
    lid_stack_5 = helpers.load_disposable_lids(protocol, lids_in_stack, ["B3"])

    drop_offset = {"x": x_offset, "y": 0, "z": 0}
    slot = 0
    lids = [lid_stack_1, lid_stack_2, lid_stack_3, lid_stack_4, lid_stack_5]
    for lid_list in lids:
        lid_to_move = lid_list[0]
        protocol.comment(f"Offset {x_offset}, Lid # {slot+1}")
        # move lid to plate in thermocycler
        protocol.move_labware(
            lid_to_move, plate_in_cycler, use_gripper=True, drop_offset=drop_offset
        )
        if trash_lid:
            protocol.move_labware(lid_to_move, trash_bin, use_gripper=True)
        else:
            protocol.move_labware(lid_to_move, lid_list[1], use_gripper = True)
