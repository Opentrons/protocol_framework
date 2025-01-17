"""Tip pick up test."""
from opentrons.protocol_api import ProtocolContext, ParameterContext, SINGLE
from abr_testing.protocols import helpers

metadata = {
    "protocolName": "Partial Tip Pick up test.",
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
        default=36,
        minimum=1,
        maximum=288,
    )
    parameters.add_bool(
        variable_name="single_tip_pick_up",
        display_name="Display Name",
        description="Turn on to activate single tip pick up.",
        default=False,
    )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    pipette_left = protocol.params.left_mount  # type: ignore[attr-defined]
    pipette_right = protocol.params.right_mount  # type: ignore[attr-defined]
    mount_to_test = protocol.params.pipette_mount  # type: ignore[attr-defined]
    tip_type = protocol.params.tip_size  # type: ignore[attr-defined]
    single_tip_pick_up = protocol.params.single_tip_pick_up  # type: ignore [attr-defined]
    reps = protocol.params.reps  # type: ignore[attr-defined]
    protocol.load_trash_bin("A3")
    tip_rack_2 = protocol.load_labware(tip_type, "D2")
    tip_rack_3 = protocol.load_labware(tip_type, "D3")
    tip_rack_1 = protocol.load_labware(tip_type, "D1")
    rack_list = [tip_rack_1, tip_rack_2, tip_rack_3]
    if mount_to_test == "left":
        pipette = protocol.load_instrument(pipette_left, "left", tip_racks=rack_list)
    else:
        pipette = protocol.load_instrument(pipette_right, "right", tip_racks=rack_list)
    if single_tip_pick_up:
        pipette.configure_nozzle_layout(style=SINGLE, start="H1", tip_racks=rack_list)
    for i in range(reps):
        pipette.pick_up_tip()
        pipette.drop_tip()
