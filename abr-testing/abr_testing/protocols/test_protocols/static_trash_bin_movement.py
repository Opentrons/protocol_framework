"""Protocol to test tip knock off on trash bin."""
from abr_testing.protocols import helpers
from opentrons.protocol_api import (
    ProtocolContext,
    InstrumentContext,
    ParameterContext,
    Labware,
    TrashBin,
)


metadata = {
    "protocolName": "Test Trash Bin Knock Off",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.21",
}

def return_tip(instrument: InstrumentContext, tiprack: Labware, well_name: str) -> None:
    """Drop a tip in a tiprack (not for reuse) avoiding static retention.
    Call this function like drop_tip(left_instrument, some_tiprack, "A2").
    This function uses internal machinery that is not part of Opentrons' stable API. It should
    be assumed to be broken whenever you update the robot.
    This function imports everything it needs and should be safe to copy-paste.
    """
    from opentrons.types import Point
    from opentrons.hardware_control.types import OT3Mount, Axis
    from opentrons.protocol_api.core.engine.instrument import InstrumentCore
    from typing import cast
    instrument_core = cast(InstrumentCore, instrument._core)
    protocol_core = instrument_core._protocol_core
    instrument.move_to(
        tiprack[well_name].top(z=(-instrument.return_height * tiprack.tip_length)))
    protocol_core.comment(f'Dropping tip from {instrument.mount} in {well_name} of {tiprack.name}')
    # Do what we do internally when we drop a tip without actually calling drop_tip()
    pipette_id = instrument_core._pipette_id
    instrument_core._engine_client.state.tips._state.length_by_pipette_id[pipette_id]
    pipette_state = instrument_core._engine_client.state.pipettes
    pipette_state._state.aspirated_volume_by_id[pipette_id] = None
    pipette_state._state.attached_tip_by_id[pipette_id] = None
    if protocol_core.is_simulating():
        return
    # This uses internal tools that aren't stable - expect this part of the protocol to
    # fail when the robot is updated.
    hardware = instrument_core._sync_hardware_api
    mount = OT3Mount.from_mount(instrument_core.get_mount())
    hw_instrument = hardware._pipette_handler.get_pipette(mount)
    config = hw_instrument.drop_configurations.plunger_eject
    well_is_left_half = int(well_name[1:]) < 8
    if well_is_left_half:
        delta = Point(x=10, y=0, z=0)
    else:
        delta = Point(x=-10, y=0, z=0)
    hardware._backend.set_active_current({Axis.of_main_tool_actuator(mount): config.current})
    hardware.move_axes(
        position={Axis.of_main_tool_actuator(mount): hw_instrument.plunger_positions.drop_tip},
        speed=config.speed,
    )
    hardware._backend.set_default_currents()
    hardware.current_position_ot3(mount, refresh=True)
    hardware.move_rel(mount, delta)
    hw_instrument.set_current_volume(0)
    hw_instrument.current_tiprack_diameter = 0.0
    hw_instrument.remove_tip()
    hardware.home([Axis.of_main_tool_actuator(mount), Axis.by_mount(mount)])
    protocol_core.set_last_location(location=None, mount=instrument_core.get_mount())

def test_pick_up_and_drop(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_rack: Labware,
    trash_bin: TrashBin,
    offset: float,
) -> None:
    """Pick up tips, drop in trash, move left or right."""
    for tips in tip_rack.columns():
        pipette.pick_up_tip()
        # Drop tip in trash_bin
        pipette.drop_tip()
        # move to trash_bin_edge
        # Move to 5 mm past the edge of trash_bin in slot C3
        pipette.move_to(trash_bin.top(-100, 0, 10))
        ctx.pause("position.")
        pipette.move_to(trash_bin.top(-100 + offset, 0, 10), force_direct=True)


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_tip_size_parameter(parameters)
    helpers.create_pipette_parameters(parameters)
    parameters.add_float(
        variable_name="offset",
        display_name="Offset",
        description="Offset on Left Side of Trash Bin",
        choices=[
            {"display_name": "-25", "value": -25.0},
            {"display_name": "-20", "value": -20.0},
            {"display_name": "-15", "value": -15.0},
            {"display_name": "-10", "value": -10.0},
            {"display_name": "-5", "value": -5.0},
        ],
        default=-10.0,
    )
    parameters.add_bool(
        variable_name = "drop_tip",
        display_name = "Drop Tip",
        description = "True means tip is dropped",
        default = False
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol to Throw Away Tips with Offset."""
    left_mount_pipette = ctx.params.left_mount  # type: ignore[attr-defined]
    right_mount_pipette = ctx.params.right_mount  # type: ignore[attr-defined]
    tip_size = ctx.params.tip_size  # type: ignore[attr-defined]
    offset = ctx.params.offset  # type: ignore[attr-defined]
    drop_tip = ctx.params.drop_tip # type: ignore[attr-defined]
    trash_bin = ctx.load_trash_bin("A3")
    tip_rack = ctx.load_labware(tip_size, "A2")
    if left_mount_pipette != "none":
        pipette = ctx.load_instrument(
            left_mount_pipette, "left", tip_racks=[tip_rack]
        )
    if right_mount_pipette != "none":
        pipette = ctx.load_instrument(
            right_mount_pipette, "right", tip_racks=[tip_rack]
        )
    if drop_tip:
        test_pick_up_and_drop(ctx, pipette, tip_rack, trash_bin, offset)
    else:
        return_spots = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12"]
        for (column, return_well) in zip(tip_rack.columns(), return_spots):
            pipette.pick_up_tip()
            return_tip(pipette, tip_rack, return_well )
            
        