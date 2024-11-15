"""Helper functions commonly used in protocols."""

from opentrons.protocol_api import (
    ProtocolContext,
    Labware,
    InstrumentContext,
    ParameterContext,
    Well,
)
from typing import Tuple
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    ThermocyclerContext,
    TemperatureModuleContext,
)
from typing import List, Union, Dict
from opentrons.hardware_control.modules.types import ThermocyclerStep
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError

# FUNCTIONS FOR LOADING COMMON CONFIGURATIONS


def load_common_liquid_setup_labware_and_instruments(
    protocol: ProtocolContext,
) -> Tuple[Labware, Labware, InstrumentContext]:
    """Load Commonly used Labware and Instruments."""
    # Tip rack
    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    # Pipette
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tip_rack]
    )
    # Source_reservoir
    source_reservoir = protocol.load_labware("nest_1_reservoir_290ml", "C2")
    protocol.load_trash_bin("A3")
    return source_reservoir, tip_rack, p1000


def load_disposable_lids(
    protocol: ProtocolContext,
    num_of_lids: int,
    deck_slot: List[str],
    deck_riser: bool = False,
) -> List[Labware]:
    """Load Stack of Disposable lids."""
    if deck_riser:
        deck_riser_adapter = protocol.load_adapter(
            "opentrons_flex_deck_riser", deck_slot[0]
        )
        unused_lids = [
            deck_riser_adapter.load_labware("opentrons_tough_pcr_auto_sealing_lid")
        ]
    else:
        unused_lids = [
            protocol.load_labware("opentrons_tough_pcr_auto_sealing_lid", deck_slot[0])
        ]

    if len(deck_slot) == 1:
        for i in range(num_of_lids - 1):
            unused_lids.append(
                unused_lids[-1].load_labware("opentrons_tough_pcr_auto_sealing_lid")
            )
    else:
        for i in range(len(deck_slot) - 1):
            unused_lids.append(
                protocol.load_labware(
                    "opentrons_tough_pcr_auto_sealing_lid", deck_slot[i]
                )
            )
    unused_lids.reverse()
    return unused_lids


def load_hs_adapter_and_labware(
    labware_str: str, heatershaker: HeaterShakerContext, labware_name: str
) -> Tuple[Labware, Labware]:
    """Load appropriate adapter on heatershaker based off labware type."""
    heatershaker_adapters = {
        "nest_96_wellplate_2ml_deep": "opentrons_96_deep_well_adapter",
        "armadillo_96_wellplate_200ul_pcr_full_skirt": "opentrons_96_pcr_adapter",
    }
    hs_adapter_type = heatershaker_adapters.get(labware_str, "")
    if hs_adapter_type:
        hs_adapter = heatershaker.load_adapter(hs_adapter_type)
        labware_on_hs = hs_adapter.load_labware(labware_str, labware_name)
    else:
        heatershaker.load_labware(labware_str, labware_name)
    return labware_on_hs, hs_adapter


def load_temp_adapter_and_labware(
    labware_str: str, temp_mod: TemperatureModuleContext, labware_name: str
) -> Tuple[Labware, Labware]:
    """Load appropriate adapter on temperature module based off labware type."""
    temp_mod_adapters = {
        "nest_96_wellplate_2ml_deep": "opentrons_96_deep_well_temp_mod_adapter",
        "armadillo_96_wellplate_200ul_pcr_full_skirt": "opentrons_96_well_aluminum_block",
    }
    temp_adapter_type = temp_mod_adapters.get(labware_str, "")
    if temp_adapter_type:
        temp_adapter = temp_mod.load_adapter(temp_adapter_type)
        labware_on_temp_mod = temp_adapter.load_labware(labware_str, labware_name)
    else:
        labware_on_temp_mod = temp_mod.load_labware(labware_str, labware_name)
    return labware_on_temp_mod, temp_adapter


# FUNCTIONS FOR LOADING COMMON PARAMETERS


def create_single_pipette_mount_parameter(parameters: ParameterContext) -> None:
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


def create_two_pipette_mount_parameters(parameters: ParameterContext) -> None:
    """Create mount parameters for 2 pipettes."""
    parameters.add_str(
        variable_name="pipette_mount_1",
        display_name="Pipette Mount 1",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="left",
    )
    parameters.add_str(
        variable_name="pipette_mount_2",
        display_name="Pipette Mount 2",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
        default="right",
    )


def create_csv_parameter(parameters: ParameterContext) -> None:
    """Create parameter for sample volume csvs."""
    parameters.add_csv_file(
        variable_name="parameters_csv",
        display_name="Sample CSV",
        description="CSV File for Protocol.",
    )


def create_disposable_lid_parameter(parameters: ParameterContext) -> None:
    """Create parameter to use/not use disposable lid."""
    parameters.add_bool(
        variable_name="disposable_lid",
        display_name="Disposable Lid",
        description="True means use lid.",
        default=True,
    )


def create_disposable_lid_trash_location(parameters: ParameterContext) -> None:
    """Create a parameter for lid placement after use."""
    parameters.add_bool(
        variable_name="trash_lid",
        display_name="Trash Disposable Lid",
        description="True means trash lid, false means keep on deck.",
        default=True,
    )


def create_tc_lid_deck_riser_parameter(parameters: ParameterContext) -> None:
    """Create parameter for tc lid deck riser."""
    parameters.add_bool(
        variable_name="deck_riser",
        display_name="Deck Riser",
        description="True means use deck riser.",
        default=False,
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
        default=0.3,
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


def create_tc_compatible_labware_parameter(parameters: ParameterContext) -> None:
    """Create parameter for labware type compatible with thermocycler."""
    parameters.add_str(
        variable_name="labware_tc_compatible",
        display_name="Labware Type for Thermocycler",
        description="labware compatible with thermocycler.",
        default="biorad_96_wellplate_200ul_pcr",
        choices=[
            {
                "display_name": "Armadillo_200ul",
                "value": "armadillo_96_wellplate_200ul_pcr_full_skirt",
            },
            {"display_name": "Bio-Rad_200ul", "value": "biorad_96_wellplate_200ul_pcr"},
            {
                "display_name": "NEST_100ul",
                "value": "nest_96_wellplate_100ul_pcr_full_skirt",
            },
            {
                "display_name": "Opentrons_200ul",
                "value": "opentrons_96_wellplate_200ul_pcr_full_skirt",
            },
        ],
    )


# FUNCTIONS FOR COMMON MODULE SEQUENCES


def move_labware_from_hs_to_destination(
    protocol: ProtocolContext,
    labware_to_move: Labware,
    hs: HeaterShakerContext,
    new_module: Union[MagneticBlockContext, ThermocyclerContext],
) -> None:
    """Move labware from heatershaker to magnetic block."""
    hs.open_labware_latch()
    protocol.move_labware(labware_to_move, new_module, use_gripper=True)
    hs.close_labware_latch()


def move_labware_to_hs(
    protocol: ProtocolContext,
    labware_to_move: Labware,
    hs: HeaterShakerContext,
    hs_adapter: Union[Labware, HeaterShakerContext],
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
    hs.close_labware_latch()
    hs.set_and_wait_for_shake_speed(hs_speed)
    protocol.delay(
        minutes=time_min,
        msg=f"Shake at {hs_speed}  rpm for {time_min} minutes.",
    )
    if deactivate:
        hs.deactivate_shaker()


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


# FUNCTIONS FOR COMMON PIPETTE COMMAND SEQUENCES


def find_liquid_height(pipette: InstrumentContext, well_to_probe: Well) -> float:
    """Find liquid height of well."""
    try:
        liquid_height = (
            pipette.measure_liquid_height(well_to_probe)
            - well_to_probe.bottom().point.z
        )
    except PipetteLiquidNotFoundError:
        liquid_height = 0
    return liquid_height


def load_wells_with_custom_liquids(
    protocol: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
) -> None:
    """Load custom liquids into wells."""
    liquid_colors = [
        "#008000",
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
    i = 0
    volume = 0.0
    for liquid_name, wells_info in liquid_vols_and_wells.items():
        # Define the liquid with a color
        liquid = protocol.define_liquid(
            liquid_name, display_color=liquid_colors[i % len(liquid_colors)]
        )
        i += 1
        # Load liquid into each specified well or list of wells
        for well_info in wells_info:
            if isinstance(well_info["well"], list):
                wells = well_info["well"]
            elif isinstance(well_info["well"], Well):
                wells = [well_info["well"]]
            else:
                wells = []
            if isinstance(well_info["volume"], float):
                volume = well_info["volume"]

            # Load liquid into each well
            for well in wells:
                well.load_liquid(liquid, volume)


def find_liquid_height_of_all_wells(
    protocol: ProtocolContext,
    pipette: InstrumentContext,
    wells: List[Well],
) -> Dict:
    """Find the liquid height of all wells in protocol."""
    dict_of_labware_heights = {}
    pipette.pick_up_tip()
    pip_channels = pipette.active_channels
    for well in wells:
        labware_name = well.parent.load_name
        total_number_of_wells_in_plate = len(well.parent.wells())
        # if pip_channels is > 1 and total_wells > 12 - only probe 1st row.
        if (
            pip_channels > 1
            and total_number_of_wells_in_plate > 12
            and well.well_name.startswith("A")
        ):
            liquid_height_of_well = find_liquid_height(pipette, well)
            dict_of_labware_heights[labware_name, well] = liquid_height_of_well
        elif total_number_of_wells_in_plate <= 12:
            liquid_height_of_well = find_liquid_height(pipette, well)
            dict_of_labware_heights[labware_name, well] = liquid_height_of_well
    if pip_channels != pipette.channels:
        pipette.drop_tip()
    else:
        pipette.return_tip()
        pipette.reset_tipracks()
    msg = f"result: {dict_of_labware_heights}"
    protocol.comment(msg=msg)
    return dict_of_labware_heights


def find_liquid_height_of_loaded_liquids(
    ctx: ProtocolContext,
    liquid_vols_and_wells: Dict[str, List[Dict[str, Union[Well, List[Well], float]]]],
    pipette: InstrumentContext,
) -> List[Well]:
    """Find Liquid height of loaded liquids."""
    load_wells_with_custom_liquids(ctx, liquid_vols_and_wells)
    # Get flattened list of wells.
    wells: list[Well] = [
        well
        for items in liquid_vols_and_wells.values()
        for entry in items
        if isinstance(entry["well"], (Well, list)) and entry["volume"] != 0.0
        # Ensure "well" is Well or list of Well
        for well in (
            entry["well"] if isinstance(entry["well"], list) else [entry["well"]]
        )
    ]
    find_liquid_height_of_all_wells(ctx, pipette, wells)
    return wells


def load_wells_with_water(
    protocol: ProtocolContext, wells: List[Well], volumes: List[float]
) -> None:
    """Load liquids into wells."""
    water = protocol.define_liquid("Water", display_color="#0000FF")
    for well, volume in zip(wells, volumes):
        well.load_liquid(water, volume)


# CONSTANTS

hs_str = "heaterShakerModuleV1"
mag_str = "magneticBlockV1"
temp_str = "temperature module gen2"
tc_str = "thermocycler module gen2"
abs_mod_str = "absorbanceReaderV1"
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

# THERMOCYCLER PROFILES


def perform_pcr(
    protocol: ProtocolContext,
    thermocycler: ThermocyclerContext,
    initial_denature_time_sec: int,
    denaturation_time_sec: int,
    anneal_time_sec: int,
    extension_time_sec: int,
    cycle_repetitions: int,
    final_extension_time_min: int,
) -> None:
    """Perform PCR."""
    # Define profiles.
    initial_denaturation_profile: List[ThermocyclerStep] = [
        {"temperature": 98, "hold_time_seconds": initial_denature_time_sec}
    ]
    cycling_profile: List[ThermocyclerStep] = [
        {"temperature": 98, "hold_time_seconds": denaturation_time_sec},
        {"temperature": 60, "hold_time_seconds": anneal_time_sec},
        {"temperature": 72, "hold_time_seconds": extension_time_sec},
    ]
    final_extension_profile: List[ThermocyclerStep] = [
        {"temperature": 72, "hold_time_minutes": final_extension_time_min}
    ]
    protocol.comment(f"Initial Denaturation for {initial_denature_time_sec} seconds.")
    thermocycler.execute_profile(
        steps=initial_denaturation_profile, repetitions=1, block_max_volume=50
    )
    protocol.comment(f"PCR for {cycle_repetitions} cycles.")
    thermocycler.execute_profile(
        steps=cycling_profile, repetitions=cycle_repetitions, block_max_volume=50
    )
    protocol.comment(f"Final Extension profile for {final_extension_time_min} minutes.")
    thermocycler.execute_profile(
        steps=final_extension_profile, repetitions=1, block_max_volume=50
    )


# TODO: Create dictionary of labware, module, and adapter.
