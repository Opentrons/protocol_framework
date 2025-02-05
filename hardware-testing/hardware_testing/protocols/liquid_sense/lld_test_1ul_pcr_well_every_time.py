from os import listdir

from opentrons.protocol_api import ProtocolContext, Well, ParameterContext, OFF_DECK
from opentrons_shared_data.load import get_shared_data_root
from hardware_testing.protocols import (
    create_dye_source_well_parameter,
)
import math

metadata = {"protocolName": "LLD 1uL PCR-to-MVS-04feb-TEST-MATRIX"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": ["A2", "B1", "A3", OFF_DECK],
    "src": "C2",
    "src_tube": "B2",
    "dst": ["D3", "D2", "D1", "C1", "C2"],
    "tips_200": "A1",
    "diluent_reservoir": "C3",
}

TARGET_UL = 1
SUBMERGE_MM = -1.5
BOTTOM_MM = 3.0
DILUENT_UL = max(0, 200 - TARGET_UL)

TIP_VOLUME = 50
PIP_VOLUME = 50
DEAD_VOL_DILUENT = 3000
DEAD_VOL_DYE = 10

SRC_LABWARE = "opentrons_96_wellplate_200ul_pcr_full_skirt"
DST_LABWARE = "corning_96_wellplate_360ul_flat"
DILUENT_LABWARE = "nest_12_reservoir_15ml"


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="columns",
        display_name="Number of Columns",
        minimum=1,
        maximum=12,
        default=12,
    )
    parameters.add_bool(
        variable_name="baseline", display_name="Baseline", default=False
    )
    create_dye_source_well_parameter(parameters)
    parameters.add_int(
        variable_name="num_of_plates",
        display_name="Number of Plates",
        minimum=1,
        maximum=5,
        default=1,
    )
    parameters.add_bool(
        variable_name="skip_diluent", display_name="Skip Diluent", default=False
    )
    parameters.add_float(
        variable_name="push_out",
        display_name="Push Out",
        choices=[
            {"display_name": "LV default", "value": 7},
            {"display_name": "LV MAX", "value": 11.7},
            {"display_name": "Default default", "value": 2},
            {"display_name": "Default MAX", "value": 3.9},
        ],
        default=11.7,
    ),
    parameters.add_bool(
        variable_name="use_test_matrix", display_name="Use Test Matrix", default=True
    )


def get_latest_version(load_name: str) -> int:
    labware_def_location = (
        f"{get_shared_data_root()}/labware/definitions/3/{load_name}/"
    )
    labware_def_latest = sorted(listdir(labware_def_location))[-1]
    return int(labware_def_latest[0])


def run(ctx: ProtocolContext) -> None:
    global TRIALS, DILUENT_UL
    ctx.load_trash_bin("A3")
    columns = ctx.params.columns  # type: ignore[attr-defined]
    baseline = ctx.params.baseline  # type: ignore[attr-defined]
    SRC_WELL = ctx.params.dye_source_well  # type: ignore[attr-defined]
    num_of_plates = ctx.params.num_of_plates  # type: ignore[attr-defined]
    skip_diluent = ctx.params.skip_diluent  # type: ignore[attr-defined]
    push_out = ctx.params.push_out  # type: ignore[attr-defined]
    use_test_matrix = ctx.params.use_test_matrix  # type: ignore[attr-defined]
    TRIALS = columns * 8 * num_of_plates
    # Test Matrix
    test_matrix = {
        "A": {"ASP": "M_LLD", "DSP": "M"},
        "B": {"ASP": "M_LLD", "DSP": "M"},
        "C": {"ASP": "M", "DSP": "M"},
        "D": {"ASP": "M", "DSP": "M"},
        "E": {"ASP": "B", "DSP": "B"},
        "F": {"ASP": "B", "DSP": "B"},
        "G": {"ASP": "M_LLD_TIP", "DSP": "M"},
        "H": {"ASP": "M_LLD_TIP", "DSP": "M"},
    }

    # LOAD 50 UL TIPS based on # of plates
    tip_racks_50s = []
    if not test_matrix:
        for i in range(num_of_plates):
            tip_rack = ctx.load_labware(
                f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                location=SLOTS["tips"][i],
                version=1,
            )
            tip_racks_50s.append(tip_rack)
    else:
        for i in range(2):
            tip_rack = ctx.load_labware(
                f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                location=SLOTS["tips"][i],
                version=1,
            )
            tip_racks_50s.append(tip_rack)
    tip_rack_200 = ctx.load_labware(
        "opentrons_flex_96_tiprack_200ul", location=SLOTS["tips_200"]
    )
    diluent_reservoir = ctx.load_labware(
        DILUENT_LABWARE,
        location=SLOTS["diluent_reservoir"],
        version=get_latest_version(DILUENT_LABWARE),
    )
    pipette = ctx.load_instrument(
        f"flex_1channel_{PIP_VOLUME}", mount="left", tip_racks=tip_racks_50s
    )
    diluent_pipette = ctx.load_instrument(
        "flex_8channel_1000", mount="right", tip_racks=[tip_rack_200]
    )
    # SRC and DST labware
    src_tube = ctx.load_labware(
        "opentrons_24_aluminumblock_nest_1.5ml_snapcap",
        location=SLOTS["src_tube"],
        version=get_latest_version(
            "opentrons_24_aluminumblock_nest_1.5ml_snapcap"
        ),
    )
    src_labware = ctx.load_labware(
        SRC_LABWARE, location=SLOTS["src"], version=get_latest_version(SRC_LABWARE)
    )
    # Load list of destination labware
    dst_labwares = []
    for i in range(num_of_plates + 1):
        if i == 0:
            continue
        dst_labware_XX = ctx.load_labware(
            DST_LABWARE,
            location=SLOTS["dst"][i - 1],
            version=get_latest_version(DST_LABWARE),
            label=f"DST Labware {i}",
        )
        dst_labwares.append(dst_labware_XX)

    # define starting liquid volumes
    # load diluent wells
    diluent = ctx.define_liquid("diluent", "#0000FF")
    # list of potential diluent wells
    diluent_wells = [
        diluent_reservoir["A1"],
        diluent_reservoir["A2"],
        diluent_reservoir["A3"],
        diluent_reservoir["A4"],
        diluent_reservoir["A5"],
        diluent_reservoir["A6"],
        diluent_reservoir["A7"],
        diluent_reservoir["A8"],
        diluent_reservoir["A9"],
        diluent_reservoir["A10"],
        diluent_reservoir["A11"],
        diluent_reservoir["A12"],
    ]
    total_diluent_needed = DILUENT_UL * TRIALS  # total diluent needed
    number_of_wells_needed = math.ceil(
        total_diluent_needed / 9000
    )  # total number of wells needed
    total_vol_per_well = (
        total_diluent_needed / number_of_wells_needed
    ) + DEAD_VOL_DILUENT
    diluent_wells_used = diluent_wells[:number_of_wells_needed]
    diluent_reservoir.load_liquid(diluent_wells_used, total_vol_per_well, diluent)
    # load dye based on number of trials
    total_dye_needed = TARGET_UL * TRIALS
    total_wells_needed = math.ceil(
        total_dye_needed / (src_labware.wells()[0].max_volume - DEAD_VOL_DYE)
    )
    src_labware_wells = []
    for well in range(total_wells_needed):
        source_column = SRC_WELL[0]
        source_row = int(SRC_WELL[1]) + well
        new_well = source_column + str(source_row)
        src_labware_wells.append(src_labware[new_well])
    dye_per_well = (total_dye_needed / total_wells_needed) + DEAD_VOL_DYE
    dye = ctx.define_liquid("dye", "#FF0000")
    dye_per_well_list = []
    dye_per_well_list += total_wells_needed * [dye_per_well]
    src_tube_list = []
    src_tube_list += total_wells_needed * [src_tube["A1"]]
    if baseline:
        src_tube.load_empty([src_tube["A1"]])
    else:
        src_tube.load_liquid([src_tube["A1"]], total_dye_needed+100, dye)
        pipette.transfer(dye_per_well_list, src_tube_list, src_labware_wells)
    for dst_labware in dst_labwares:
        if not diluent:
            dst_labware.load_liquid(dst_labware.wells(), 199, diluent)
        else:
            dst_labware.load_empty(dst_labware.wells())

    def _run_trial(dst_well: Well, use_lld: bool, dye_used: int) -> None:
        # change tip before every aspirate
        well_name_letter = dst_well.well_name[0]
        asp_behavior = test_matrix[well_name_letter]["ASP"]
        dsp_behavior = test_matrix[well_name_letter]["DSP"]
        pipette.pick_up_tip()
        well_num = 0
        src_well = src_labware_wells[well_num]
        if "LLD" in asp_behavior:
            pipette.require_liquid_presence(src_well)
            if "T" in asp_behavior:
                # switch tip
                pipette.drop_tip()
                pipette.pick_up_tip()
        pipette.configure_for_volume(TARGET_UL)
        if "M" in asp_behavior:
            # NOTE: if liquid height is <2.5mm, protocol may error out
            #       this can be avoided by adding extra starting liquid in the SRC labware
            pipette.aspirate(TARGET_UL, src_well.meniscus(SUBMERGE_MM))
        else:
            pipette.aspirate(TARGET_UL, src_well.bottom(BOTTOM_MM))
        if "M" in dsp_behavior:
            pipette.dispense(
                TARGET_UL, dst_well.meniscus(SUBMERGE_MM), push_out=push_out
            )  # contact
        else:
            pipette.dispense(
                TARGET_UL, dst_well.bottom(BOTTOM_MM), push_out=push_out
            )  # contact
        dye_used += TARGET_UL
        if dye_used > dye_per_well:
            dye_used = 0
            well_num += 1
            src_well = src_labware[well_num]
        pipette.return_tip()

    # fill with diluent
    if not skip_diluent:
        ctx.comment("FILLING DESTINATION PLATE WITH DILUENT")
        if baseline:
            DILUENT_UL += TARGET_UL
        for plate in dst_labwares:
            dst_labware = plate
            diluent_pipette.reset_tipracks()
            # CHECK IF THIS IS 5TH PLATE
            if (dst_labwares[-1] == dst_labware) and (len(dst_labwares) == 5):
                # MOVE 50 UL TIP RACK FROM OFF DECK
                tip_rack_location = tip_racks_50s[-2].parent
                ctx.move_labware(
                    tip_racks_50s[-2], new_location=OFF_DECK, use_gripper=False
                )
                ctx.move_labware(
                    tip_racks_50s[-1], new_location=tip_rack_location, use_gripper=False
                )
            i = 0
            # fill with diluent
            for i in range(columns):
                if i >= columns/2:
                    if use_test_matrix:
                        DILUENT_UL = 100
                diluent_well = diluent_wells[i % len(diluent_wells_used)]
                if i < len(diluent_wells_used):
                    if diluent_pipette.has_tip:
                        diluent_pipette.return_tip()
                        diluent_pipette.pick_up_tip()
                        diluent_pipette.require_liquid_presence(diluent_well)
                if not diluent_pipette.has_tip:
                    diluent_pipette.pick_up_tip()
                diluent_pipette.aspirate(DILUENT_UL, diluent_well.bottom(0.5))
                diluent_pipette.dispense(
                    DILUENT_UL, dst_labware[f"A{i+1}"].top(), push_out=20
                )
            diluent_pipette.return_tip()
    dye_used = 0

    if not baseline:
        for i, w in enumerate(dst_labware.wells()[:TRIALS]):
            _run_trial(
                w, use_lld=bool((i % 2) == 0), dye_used=dye_used
            )  # switch using LLD every-other trial
    if use_test_matrix:
        diluent_pipette.pick_up_tip()
        dst_labware = dst_labwares[0]
        columns_list = list(range(columns))
        halfway = int(len(columns_list)/2)
        print(halfway)
        for i in columns_list[halfway:]:
            DILUENT_UL = 99
            diluent_well = diluent_wells[i % len(diluent_wells_used)]
            if i < len(diluent_wells_used):
                if diluent_pipette.has_tip:
                    diluent_pipette.return_tip()
                    diluent_pipette.pick_up_tip()
                    diluent_pipette.require_liquid_presence(diluent_well)
            if not diluent_pipette.has_tip:
                diluent_pipette.pick_up_tip()
            diluent_pipette.aspirate(DILUENT_UL, diluent_well.bottom(0.5))
            diluent_pipette.dispense(
                DILUENT_UL, dst_labware[f"A{i+1}"].top(), push_out=20
            )
