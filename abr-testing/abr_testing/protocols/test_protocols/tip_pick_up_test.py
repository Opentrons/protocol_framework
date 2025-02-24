"""Protocol to Stress Test Picking up Tips."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from abr_testing.protocols import helpers

metadata = {"protocolName": "Pick Up Tips Test"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    helpers.create_pipette_parameters(parameters)
    helpers.create_tip_size_parameter(parameters)
    helpers.create_single_pipette_mount_parameter(parameters)


def run(protocol: ProtocolContext) -> None:
    """Runts protocol."""
    tip_rack_type = protocol.params.tip_size  # type: ignore[attr-defined]
    pipette_mount = protocol.params.pipette_mount  # type: ignore[attr-defined]
    pipette_type_left = protocol.params.left_mount  # type: ignore[attr-defined]
    pipette_type_right = protocol.params.right_mount  # type: ignore[attr-defined]
    tip_rack_slots = ["D2", "D3", "C1", "C2", "B2", "A2", "A3"]
    tip_racks = []
    for slot in tip_rack_slots:
        tip_racks.append(protocol.load_labware(tip_rack_type, slot))
    if pipette_mount == "left":
        pipette = protocol.load_instrument(
            pipette_type_left, mount=pipette_mount, tip_racks=tip_racks
        )
    else:
        pipette = protocol.load_instrument(
            pipette_type_right, mount=pipette_mount, tip_racks=tip_racks
        )
    tip_count = 0
    total_tip_pick_ups = len(tip_rack_slots) * 12
    for i in range(10000):
        pipette.pick_up_tip()
        pipette.return_tip()
        tip_count += 1
        if tip_count >= total_tip_pick_ups:
            pipette.reset_tipracks()
