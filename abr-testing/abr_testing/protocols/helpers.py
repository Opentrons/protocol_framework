"""Helper functions commonly used in protocols."""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
)
from typing import Tuple
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    ThermocyclerContext,
)

from typing import List, Union


def load_common_liquid_setup_labware_and_instruments(
    protocol: ProtocolContext,
) -> Tuple[Labware, InstrumentContext]:
    """Load Commonly used Labware and Instruments."""
    # Tip rack
    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    # Pipette
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tip_rack]
    )
    # Source_reservoir
    source_reservoir = protocol.load_labware("axygen_1_reservoir_90ml", "C2")
    return source_reservoir, p1000


def create_pipette_mount_parameter(parameters: ParameterContext) -> None:
    """Create parameter to specify pipette mount."""
    parameters.add_str(
        variable_name="pipette_mount",
        display_name="Pipette Mount",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )


def create_disposable_lid_parameter(parameters: ParameterContext) -> None:
    """Create parameter to use/not use disposable lid."""
    parameters.add_bool(
        variable_name="disposable_lid",
        display_name="Disposable Lid",
        description="True means use lid.",
        default=True,
    )


def create_tip_size_parameter(parameters: ParameterContext) -> None:
    """Create parameter for tip size."""
    parameters.add_str(
        variable_name="tip_size",
        display_name="Tip Size",
        description="Set Tip Size",
        choices=[
            {"display_name": "50 uL", "value": "opentrons_flex_96_tiprack_50ul"},
            {"display_name": "200 µL", "value": "opentrons_flex_96_tiprack_200ul"},
            {"display_name": "1000 µL", "value": "opentrons_flex_96_tiprack_1000ul"},
        ],
        default="opentrons_flex_96_tiprack_1000ul",
    )


def create_dot_bottom_parameter(parameters: ParameterContext) -> None:
    """Create parameter for dot bottom value."""
    parameters.add_float(
        variable_name="dot_bottom",
        display_name=".bottom",
        description="Lowest value pipette will go to.",
        default=0.5,
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
        ],
    )


def create_hs_speed_parameter(parameters: ParameterContext) -> None:
    """Create parameter for max heatershaker speed."""
    parameters.add_int(
        variable_name="heater_shaker_speed",
        display_name="Heater Shaker Shake Speed",
        description="Speed to set the heater shaker to",
        default=2000,
        minimum=200,
        maximum=3000,
        unit="rpm",
    )


def move_labware_from_hs_to_mag_block(
    protocol: ProtocolContext,
    labware_to_move: Labware,
    hs: HeaterShakerContext,
    mag_block: MagneticBlockContext,
) -> None:
    """Move labware from heatershaker to magnetic block."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, mag_block, use_gripper=True)
    hs.close_labware_latch()


def move_labware_to_hs(
    protocol: ProtocolContext,
    labware_to_move: Labware,
    hs: HeaterShakerContext,
    hs_adapter: Labware,
) -> None:
    """Move labware to heatershaker."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, hs_adapter, use_gripper=True)
    hs.close_labware_latch()


def set_hs_speed(
    protocol: ProtocolContext,
    hs: HeaterShakerContext,
    hs_speed: int,
    time_min: float,
    deactivate: bool,
) -> None:
    """Set heatershaker for a speed and duration."""
    hs.set_and_wait_for_shake_speed(hs_speed)
    protocol.delay(
        minutes=time_min,
        msg=f"Shake at {hs_speed}  rpm for {time_min} minutes.",
    )
    if deactivate:
        hs.deactivate_shaker()


def load_disposable_lids(
    protocol: ProtocolContext, num_of_lids: int, deck_slot: List[str]
) -> List[Labware]:
    """Load Stack of Disposable lids."""
    unused_lids = [
        protocol.load_labware("opentrons_tough_pcr_auto_sealing_lid", deck_slot[0])
    ]
    if len(deck_slot) == 1:
        for i in range(num_of_lids - 1):
            unused_lids.append(
                unused_lids[-1].load_labware("opentrons_tough_pcr_auto_sealing_lid")
            )
    else:
        for i in range(len(deck_slot)-1):
            unused_lids.append(
                protocol.load_labware("opentrons_tough_pcr_auto_sealing_lid", deck_slot[i])
            )
    unused_lids.reverse()
    return unused_lids


def use_disposable_lid_with_tc(
    protocol: ProtocolContext,
    unused_lids: List[Labware],
    used_lids: List[Labware],
    plate_in_thermocycler: Labware,
    thermocycler: ThermocyclerContext,
) -> Tuple[Labware, List[Labware], List[Labware]]:
    """Use disposable lid with thermocycler."""
    lid_on_plate = unused_lids[0]
    protocol.move_labware(lid_on_plate, plate_in_thermocycler, use_gripper=True)
    # Remove lid from the list
    unused_lids.pop(0)
    used_lids.append(lid_on_plate)
    thermocycler.close_lid()
    return lid_on_plate, unused_lids, used_lids


# CONSTANTS

liquid_colors = [
    "#008000",
    "#008000",
    "#A52A2A",
    "#A52A2A",
    "#00FFFF",
    "#0000FF",
    "#800080",
    "#ADD8E6",
    "#FF0000",
    "#FFFF00",
    "#FF00FF",
    "#00008B",
    "#7FFFD4",
    "#FFC0CB",
    "#FFA500",
    "#00FF00",
    "#C0C0C0",
]

hs_adapter_str = "opentrons_96_pcr_adapter"
hs_str = "heaterShakerModuleV1"
mag_str = "magneticBlockV1"
temp_adapter_str = "opentrons_96_well_aluminum_block"
temp_str = "temperature module gen2"
tc_str = "thermocycler module gen2"

# TODO: Create dictionary of labware, module, and adapter.
