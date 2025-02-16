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
        "PLATE_200UL_PCR": "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "PLATE_200UL_FLAT": "nest_96_wellplate_200ul_flat",
        "PLATE_360UL_FLAT": "corning_96_wellplate_360ul_flat",
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
    num_wells = len(well.parent.wells())
    if num_wells == 1:
        raise NotImplementedError(
            "haven't implemented testing 1-well reservoir with 96ch"
        )
    if num_wells == 12:
        raise NotImplementedError(
            "haven't implemented testing 12-well reservoir with 8ch"
        )
    if num_wells == 15:
        # the 3x5 well 15ml tube-rack, let's just switch back and forth between
        # strategies for each well, like a checkerboard
        # (maybe there's a better way to code this)
        if int(well.well_name[1:]) % 2 == 1:
            return "M_LLD" if well.well_name[0] in "AC" else "M"
        else:
            return "M_LLD" if well.well_name[0] in "B" else "M"
    # by default, assign a strategy to an entire ROW of the plate
    # TODO: update this if we add more strategies
    return "M_LLD" if well.well_name[0] in "ACEG" else "M"  # default behavior


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
    # TODO: create run time parameter for min lld height


def _estimate_liquid_volume_at_height(
    well: Well, height: float, tolerance: float = 0.1, max_iterations: int = 100
) -> float:
    min_vol = 0.0
    max_vol = well.max_volume
    best_value = 0.0
    best_diff = float("inf")
    for _ in range(max_iterations):
        mid_vol = (min_vol + max_vol) / 2.0
        height_at_volume = well.estimate_liquid_height_after_pipetting(mid_vol)
        diff = abs(height_at_volume - height)
        if diff < best_diff:
            best_diff = diff
            best_value = mid_vol
        if diff < tolerance:
            return best_value
        if height_at_volume < height:
            min_vol = mid_vol  # Search in the upper half
        else:
            max_vol = mid_vol  # Search in the lower half
    return best_value


def _get_valid_dynamic_tracking_volumes_for_well(
    well: Well, pipette: InstrumentContext, submerge_mm: float, top_mm: float = -2.0
) -> Tuple[float, float]:
    dead_vol = _estimate_liquid_volume_at_height(
        well,
        pipette.get_minimum_liquid_sense_height() + abs(submerge_mm),
    )
    max_vol = _estimate_liquid_volume_at_height(
        well,
        well.depth + top_mm,
    )
    return dead_vol, max_vol


def _get_dispense_aspirate_volumes_for_well(
    well: Well,
    pipette: InstrumentContext,
    submerge_mm: float,
    mm_offset_from_min_vol: float = 0.0,
) -> Tuple[float, float]:
    min_vol, max_vol = _get_valid_dynamic_tracking_volumes_for_well(
        well, pipette, submerge_mm=submerge_mm
    )
    aspirate_vol = min(max_vol - min_vol, pipette.max_volume)
    min_vol_height = well.estimate_liquid_height_after_pipetting(min_vol)
    offset_from_well_bottom = min_vol_height + mm_offset_from_min_vol
    offset_vol = _estimate_liquid_volume_at_height(well, offset_from_well_bottom)
    assert offset_vol + aspirate_vol < max_vol
    return offset_vol + aspirate_vol, aspirate_vol


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

    # PRE-CALCULATE TEST VOLUMES
    _dispense_aspirate_vols_by_well: Dict[Well, Tuple[float, float]] = {}
    for well in test_labware.wells():
        strategy = _get_well_strategy(well)
        submerge_mm = ASPIRATE_SUBMERGE_MM_BY_STRATEGY[strategy]
        dispense, aspirate = _get_dispense_aspirate_volumes_for_well(
            well,
            pipette,
            submerge_mm,
            mm_offset_from_min_vol=0.0,  # TODO: test higher up in wells, define in mm
        )
        _dispense_aspirate_vols_by_well[well] = dispense, aspirate

    for well, asp_disp_vols in _dispense_aspirate_vols_by_well.items():
        dispense, aspirate = asp_disp_vols
        pipette.pick_up_tip()
        pipette.aspirate(dispense, dye_src_well.bottom(2))
        pipette.dispense(dispense, well.top(), push_out=79)
        pipette.drop_tip()

        # moment of TRUTH
        pipette.pick_up_tip()
        strategy = _get_well_strategy(well)
        submerge_mm = ASPIRATE_SUBMERGE_MM_BY_STRATEGY[strategy]
        if "LLD" in strategy:
            pipette.require_liquid_presence(well)
        pipette.aspirate(
            aspirate, well.meniscus(submerge_mm)
        )  # FIXME: use dynamic tracking
        # TODO: create list of 4x dst Corning wells for this specific well
        dst_wells: List[Well] = []
        # TODO: breakup aspirated volume into multi-dispense
        for i in range(4):
            pipette.dispense(
                aspirate / 4, dst_wells[i].top(), push_out=0 if i < 3 else 79
            )
        pipette.drop_tip()
