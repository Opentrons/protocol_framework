"""Testing LLD Height Estimation during 1000uL Dynamic Aspirations."""
from os import listdir
from os.path import isdir
from typing import Optional, Dict, Tuple, List, Any

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Labware,
    InstrumentContext,
    Well,
)
from opentrons_shared_data.load import get_shared_data_root

metadata = {"protocolName": "LLD 1000uL Tube-to-Tube"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

NUM_TIP_SLOTS = 3
SLOTS = {
    "tips_1": "B1",
    "tips_2": "B2",
    "tips_3": "B3",
    "src_reservoir": "D2",
    "test_labware": "D1",
    "dst_plate": "D3",
}

ASPIRATE_SUBMERGE_MM_BY_STRATEGY = {
    "M_LLD": -1.5,
    "M": -3.0,
}

RANGE_HV_UL = {"max": 250.0, "min": 200.0}

P1000_MAX_PUSH_OUT_UL = 79.0

LOAD_NAME_SRC_RESERVOIR = "nest_1_reservoir_290ml"

# optical flat-bottom, for use in plate-reader
LOAD_NAME_DST_PLATE = "corning_96_wellplate_360ul_flat.5ml_snapcap"

LOAD_NAME_SRC_LABWARE_BY_CHANNELS = {
    1: {  # 1ch pipette
        "TUBES_2ML_SCREWCAP": "opentrons_24_tuberack_nest_2ml_screwcap",
        "TUBES_2ML_SNAPCAP": "opentrons_24_tuberack_nest_2ml_snapcap",
        "TUBES_1_5ML_SCREWCAP": "opentrons_24_tuberack_nest_1.5ml_screwcap",
        "TUBES_1_5ML_SNAPCAP": "opentrons_24_tuberack_nest_1.5ml_snapcap",
        "TUBES_15ML": "opentrons_15_tuberack_nest_15ml_conical",
        "TUBES_50ML": "opentrons_6_tuberack_nest_50ml_conical",
        "PLATE_200UL_PCR": "opentrons_96_wellplate_200ul_pcr_full_skirt",  # single-dispense (~150ul)
        "PLATE_200UL_FLAT": "nest_96_wellplate_200ul_flat",  # single-dispense (~150ul)
        "PLATE_360UL_FLAT": "corning_96_wellplate_360ul_flat",  # single-dispense (~200ul)
        "PLATE_2ML_DEEP": "nest_96_wellplate_2ml_deep",
    },
    8: {  # 8ch pipette
        "PLATE_15ML_RESERVOIR": "nest_12_reservoir_15ml",
    },
    96: {  # 96ch pipette
        "PLATE_195ML_RESERVOIR": "nest_1_reservoir_195ml",
        "PLATE_290ML_RESERVOIR": "nest_1_reservoir_290ml",
    },
}


def _get_well_strategy(well: Well) -> str:
    well_row = well.well_name[0]
    well_column = int(well.well_name[1:])
    num_wells_in_labware = len(well.parent.wells())
    if num_wells_in_labware == 1:  # just the 2x different 1-well reservoirs
        raise NotImplementedError(
            "haven't yet implemented testing 1-well reservoir with 96ch"
        )
    elif num_wells_in_labware == 12:  # just the 12-row reservoir
        if well_row % 2 == 1:
            return "M_LLD"
        else:
            return "M"
    elif num_wells_in_labware == 15:  # just the 15ml tube-rack
        if well_column % 2 == 1:
            return "M_LLD" if well_row in "AC" else "M"
        else:
            return "M_LLD" if well_row in "B" else "M"
    else:
        # DEFAULT: assign a strategy to an entire ROW of the plate
        return "M_LLD" if well_row in "ACEG" else "M"


def _load_labware(
    ctx: ProtocolContext, load_name: str, location: str, **kwargs: Any
) -> Labware:
    version: Optional[int] = None
    # will attempt to load the newest version of a Schema 3 labware (if found)
    # else it will fall back to whatever the API defaults to
    # finally, load it as empty (why not?)
    try:
        labware_def_location = (
            f"{get_shared_data_root()}/labware/definitions/3/{load_name}/"
        )
        assert isdir(labware_def_location)
        labware_def_latest = sorted(listdir(labware_def_location))[-1]
        version = int(labware_def_latest[0])
    except (AssertionError, FileNotFoundError, IndexError, ValueError):
        pass
    ret_labware = ctx.load_labware(load_name, location, version=version, **kwargs)
    if not ret_labware.is_tiprack:
        ret_labware.load_empty(ret_labware.wells())
    return ret_labware


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        display_name="channels",
        variable_name="channels",
        default=min(list(LOAD_NAME_SRC_LABWARE_BY_CHANNELS.keys())),
        choices=[
            {"display_name": str(ch), "value": ch}
            for ch in LOAD_NAME_SRC_LABWARE_BY_CHANNELS.keys()
        ],
    )
    parameters.add_str(
        display_name="test_labware",
        variable_name="test_labware",
        default=LOAD_NAME_SRC_LABWARE_BY_CHANNELS[1]["TUBES_2ML_SCREWCAP"],
        choices=[
            {"display_name": label, "value": load_name}
            for info in LOAD_NAME_SRC_LABWARE_BY_CHANNELS.values()
            for label, load_name in info.items()
        ],
    )
    parameters.add_str(
        display_name="mount",
        variable_name="mount",
        default="left",
        choices=[{"display_name": m, "value": m} for m in ["left", "right"]],
    )


def _binary_search_liquid_volume_at_height(
    well: Well, height: float, tolerance_mm: float = 0.1, max_iterations: int = 100
) -> float:
    # binary search to find a close-enough volume for a given height
    min_vol = 0.0
    max_vol = well.max_volume
    best_value = 0.0
    best_diff = float("inf")
    for _ in range(max_iterations):
        mid_vol = (min_vol + max_vol) / 2.0
        mid_vol_height = well.estimate_liquid_height_after_pipetting(mid_vol)
        diff_mm = abs(mid_vol_height - height)
        if diff_mm < best_diff:
            best_diff = diff_mm
            best_value = mid_vol
        if diff_mm < tolerance_mm:
            return best_value
        if mid_vol_height < height:
            min_vol = mid_vol  # Search in the upper half
        else:
            max_vol = mid_vol  # Search in the lower half
    return best_value


def _get_nominal_volume_range_for_dynamic_tracking(
    well: Well, pipette: InstrumentContext, submerge_mm: float, top_mm: float = -2.0
) -> Tuple[float, float]:
    min_vol = _binary_search_liquid_volume_at_height(
        well,
        pipette.get_minimum_liquid_sense_height() + abs(submerge_mm),
    )
    # NOTE: (sigler) top_mm is supposed to represent the deformation we observed
    #       at the top ~1mm of the PCR well. We assume all labware have a
    #       similar things, so let's stay away (eg: 2mm) from the top.
    max_vol = _binary_search_liquid_volume_at_height(
        well,
        well.depth + top_mm,
    )
    return min_vol, max_vol


def _get_dispense_aspirate_volumes_for_well(
    well: Well,
    pipette: InstrumentContext,
    submerge_mm: float,
    mm_offset_min_vol_to_ending_height: float = 0.0,
) -> Tuple[float, float]:
    min_vol, max_vol = _get_nominal_volume_range_for_dynamic_tracking(
        well, pipette, submerge_mm=submerge_mm
    )
    # always try to aspirate 1000ul (b/c it creates largest Z travel)
    aspirate_vol = min(max_vol - min_vol, pipette.max_volume)
    assert well.current_liquid_height == 0
    min_vol_height = well.estimate_liquid_height_after_pipetting(min_vol)
    ending_height = min_vol_height + mm_offset_min_vol_to_ending_height
    ending_volume = _binary_search_liquid_volume_at_height(well, ending_height)
    dispense_volume = ending_volume + aspirate_vol
    assert (
        dispense_volume < max_vol
    ), f"offset {mm_offset_min_vol_to_ending_height} too large"
    return dispense_volume, aspirate_vol


def run(ctx: ProtocolContext) -> None:
    """Run."""
    # RUNTIME PARAMETERS
    channels = ctx.params.channels  # type: ignore[attr-defined]
    test_labware_load_name = ctx.params.test_labware  # type: ignore[attr-defined]
    mount = ctx.params.mount  # type: ignore[attr-defined]

    # LOAD PIPETTES
    num_tip_slots = len([s for s in SLOTS.keys() if "tip" in s])
    pipette = ctx.load_instrument(
        instrument_name=f"flex_{channels}channel_1000",
        mount=mount,
        tip_racks=[
            _load_labware(
                ctx, "opentrons_flex_96_tiprack_1000ul", SLOTS[f"tips_{i + 1}"]
            )
            for i in range(num_tip_slots)
        ],
    )

    # LOAD LABWARE
    assert test_labware_load_name in list(
        LOAD_NAME_SRC_LABWARE_BY_CHANNELS[pipette.channels].keys()
    ), f"{test_labware_load_name} cannot be tested with {pipette.channels}ch pipette"
    src_reservoir = _load_labware(ctx, LOAD_NAME_SRC_RESERVOIR, SLOTS["src_reservoir"])
    test_labware = _load_labware(ctx, test_labware_load_name, SLOTS["test_labware"])
    dst_plate = _load_labware(ctx, LOAD_NAME_DST_PLATE, SLOTS["dst_plate"])

    # LOAD LIQUID
    dye_src_well = src_reservoir["A1"]
    range_hv = ctx.define_liquid(name="range-hv", display_color="#FF0000")
    src_reservoir.load_liquid([dye_src_well], dye_src_well.max_volume, range_hv)

    # MULTI-DISPENSE DESTINATIONS
    if "ul_" in test_labware.load_name:
        num_multi_dispenses = 1
    else:
        num_multi_dispenses = 4
    multi_dispense_wells = dst_plate.wells()
    multi_dispense_wells_by_test_well: Dict[Well, List[Well]] = {}
    for well in test_labware.wells():
        multi_dispense_wells_by_test_well[well] = [
            multi_dispense_wells.pop(0) for _ in range(num_multi_dispenses)
        ]
        if not multi_dispense_wells:
            break

    # PRE-CALCULATE TEST VOLUMES
    dispense_aspirate_vols_by_well: Dict[Well, Tuple[float, float]] = {}
    # NOTE: only possible to test the wells that have been assigned multi-dispense wells
    wells_being_tested = list(multi_dispense_wells_by_test_well.keys())
    for well in wells_being_tested:
        strategy = _get_well_strategy(well)
        submerge_mm = ASPIRATE_SUBMERGE_MM_BY_STRATEGY[strategy]
        dispense, aspirate = _get_dispense_aspirate_volumes_for_well(
            well,
            pipette,
            submerge_mm,
            mm_offset_min_vol_to_ending_height=5.0,  # NOTE: 5mm is a safe margin to get started
        )
        dispense_aspirate_vols_by_well[well] = dispense, aspirate

    for well, asp_disp_vols in dispense_aspirate_vols_by_well.items():
        # FIXME: use dynamic tracking for ALL aspirates/dispenses

        # transfer dye from reservoir to test well
        dispense, aspirate = asp_disp_vols
        pipette.pick_up_tip()
        pipette.aspirate(dispense, dye_src_well.bottom(2))
        pipette.dispense(
            dispense, well.top(), push_out=P1000_MAX_PUSH_OUT_UL
        )  # adding dye to tube
        pipette.drop_tip()

        # aspirate from test well, then multi-dispense
        pipette.pick_up_tip()
        strategy = _get_well_strategy(well)
        submerge_mm = ASPIRATE_SUBMERGE_MM_BY_STRATEGY[strategy]
        if "LLD" in strategy:
            pipette.require_liquid_presence(well)
        pipette.aspirate(aspirate, well.meniscus(submerge_mm))  # removing dye from tube
        for dst_well in multi_dispense_wells_by_test_well[well]:
            available_to_multi_dispense = pipette.current_volume - RANGE_HV_UL["min"]
            if available_to_multi_dispense >= RANGE_HV_UL["min"]:
                disp_vol = min(available_to_multi_dispense, RANGE_HV_UL["max"])
                push_out = 0.0
            elif RANGE_HV_UL["max"] >= pipette.current_volume >= RANGE_HV_UL["min"]:
                disp_vol = pipette.current_volume
                push_out = P1000_MAX_PUSH_OUT_UL
            else:
                raise RuntimeError(
                    f"pipette has unexpected volume: {pipette.current_volume}"
                )
            pipette.dispense(
                disp_vol, dst_well.top(), push_out=push_out
            )  # multi-dispense to plate
        pipette.drop_tip()
