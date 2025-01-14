"""Tip pick up test."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
)
from abr_testing.protocols import helpers

metadata = {
    "protocolName": "Pipette Pick up test.",
    "author": "Rhyann Clarke, opentrons",
    "description": "Protocol to test pick up",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.21",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_pipette_parameters(parameters)
    helpers.create_single_pipette_mount_parameter(parameters)
    helpers.create_tip_size_parameter(parameters)
    parameters.add_int(
        variable_name="reps",
        display_name="Number of Repetitions",
        default=12,
        minimum=1,
        maximum=120,
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    pipette_left = protocol.params.left_mount  # type: ignore[attr-defined]
    pipette_right = protocol.params.right_mount  # type: ignore[attr-defined]
    mount_to_test = protocol.params.pipette_mount  # type: ignore[attr-defined]
    tip_type = protocol.params.tip_size  # type: ignore[attr-defined]
    reps = protocol.params.reps  # type: ignore[attr-defined]
    tip_rack = protocol.load_labware(tip_type, "D2")
    if mount_to_test == "left":
        pipette = protocol.load_instrument(pipette_left, "left", tip_racks=[tip_rack])
    else:
        pipette = protocol.load_instrument(pipette_right, "right", tip_racks=[tip_rack])
    tip_count = 0
    for i in range(reps):
        pipette.pick_up_tip()
        pipette.return_tip()
        tip_count += 1
        if tip_count > 12:
            pipette.reset_tipracks()
            tip_count = 0
