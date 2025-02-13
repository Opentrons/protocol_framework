"""old code."""
from os import listdir

from opentrons.protocol_api import ProtocolContext, Well, ParameterContext, OFF_DECK
from opentrons_shared_data.load import get_shared_data_root
from hardware_testing.protocols import (
    create_dye_source_well_parameter,
)
import math

metadata = {"protocolName": "LLD 1uL PCR-to-MVS-04feb-TEST-MATRIX-T-B-M"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": ["A2", "A3", "B2", "B3", "A4", "B4"],
    "src": "C2",
    "src_tube": "B1",
    "dst": ["D3", "D2", "D1", "C1"],
    "tips_200": "A1",
    "diluent_reservoir": "C3",
    "lids": "D4",
}

TARGET_UL = 1
SUBMERGE_MM = -1.5
BOTTOM_MM = 3.0

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
        maximum=4,
        default=4,
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
    global TRIALS
    columns = ctx.params.columns  # type: ignore[attr-defined]
    baseline = ctx.params.baseline  # type: ignore[attr-defined]
    num_of_plates = ctx.params.num_of_plates  # type: ignore[attr-defined]
    skip_diluent = ctx.params.skip_diluent  # type: ignore[attr-defined]
    push_out = ctx.params.push_out  # type: ignore[attr-defined]
    use_test_matrix = ctx.params.use_test_matrix  # type: ignore[attr-defined]
    TRIALS = columns * 8 * num_of_plates
    # Test Matrix
    test_matrix = {
        "A": {"ASP": "M_LLD", "DSP": "M", "SRC_WELL": "A1"},
        "B": {"ASP": "M_LLD", "DSP": "M", "SRC_WELL": "A1"},
        "C": {"ASP": "M", "DSP": "M", "SRC_WELL": "A2"},
        "D": {"ASP": "M", "DSP": "M", "SRC_WELL": "A2"},
        "E": {"ASP": "B", "DSP": "T", "SRC_WELL": "A3"},
        "F": {"ASP": "B", "DSP": "B", "SRC_WELL": "A3"},
        "G": {"ASP": "M_LLD_TIP", "DSP": "M", "SRC_WELL": "A4"},
        "H": {"ASP": "M_LLD_TIP", "DSP": "M", "SRC_WELL": "A4"},
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
        for i in SLOTS["tips"]:
            tip_rack = ctx.load_labware(
                f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                location=i,
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
    # diluent_reservoir_lid = diluent_reservoir.load_labware(DILUENT_LABWARE)
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
        version=get_latest_version("opentrons_24_aluminumblock_nest_1.5ml_snapcap"),
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
    # LOAD LIDS
    lids = [ctx.load_labware("plate_lid", SLOTS["lids"])]
    for i in range(num_of_plates):
        lids.append(lids[-1].load_labware("plate_lid"))
    lids.reverse()
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
    total_diluent_needed = 200 * TRIALS  # total diluent needed
    number_of_wells_needed = math.ceil(
        total_diluent_needed / 9000
    )  # total number of wells needed
    total_vol_per_well = (
        total_diluent_needed / number_of_wells_needed
    ) + DEAD_VOL_DILUENT
    diluent_wells_used = diluent_wells[:number_of_wells_needed]
    diluent_reservoir.load_liquid(diluent_wells_used, total_vol_per_well, diluent)
    # load dye based on number of trials
    volume_list = [1.0, 1.2, 1.5, 2.0]
    total_dye_needed = (
        sum([(vol * 12) + 10 for vol in volume_list[:num_of_plates]]) * num_of_plates
    )
    dye_per_well = sum([(vol * 12) for vol in volume_list]) + 10
    src_labware_wells = [
        src_labware["A1"],
        src_labware["A2"],
        src_labware["A3"],
        src_labware["A4"],
    ]
    dye_per_well_list = len(src_labware_wells) * [dye_per_well]
    src_tube_list = len(src_labware_wells) * [src_tube["A1"]]
    dye = ctx.define_liquid("dye", "#FF0000")

    if baseline:
        src_tube.load_empty([src_tube["A1"]])
    else:
        src_tube.load_liquid([src_tube["A1"]], total_dye_needed + 100, dye)
        pipette.transfer(
            volume=dye_per_well_list,
            source=src_tube_list,
            dest=src_labware_wells,
            trash=False,
        )
        tip_counter = 1
    for dst_labware in dst_labwares:
        if not diluent:
            dst_labware.load_liquid(dst_labware.wells(), 199, diluent)
        else:
            dst_labware.load_empty(dst_labware.wells())

    def _run_trial(
        dst_well: Well, dye_used: int, tip_counter: int, target_ul: float
    ) -> int:
        # change tip before every aspirate
        well_name_letter = dst_well.well_name[0]
        well_number = dst_well.well_name[1]
        asp_behavior = test_matrix[well_name_letter]["ASP"]
        dsp_behavior = test_matrix[well_name_letter]["DSP"]
        src_well_str = test_matrix[well_name_letter]["SRC_WELL"]
        src_well = src_labware[src_well_str]
        if tip_counter > (4 * 96):
            print("started moving tip racks")
            ctx.move_labware(tip_racks_50s[0], "C4", use_gripper=True)
            ctx.move_labware(tip_racks_50s[4], SLOTS["tips"][0], use_gripper=True)
            ctx.move_labware(tip_racks_50s[2], SLOTS["tips"][4], use_gripper=True)
            ctx.move_labware(tip_racks_50s[5], SLOTS["tips"][2], use_gripper=True)
            tip_counter = 0
        tip_counter += 1
        pipette.pick_up_tip()

        if "LLD" in asp_behavior:
            pipette.require_liquid_presence(src_well)
            if "T" in asp_behavior:
                # switch tip
                pipette.return_tip()
                pipette.pick_up_tip()
                tip_counter += 1
        pipette.configure_for_volume(target_ul)
        # ASPIRATE
        if "M" in asp_behavior:
            # NOTE: if liquid height is <2.5mm, protocol may error out
            #       this can be avoided by adding extra starting liquid in the SRC labware
            # need to probe new well before doing meniscus relative
            if int(well_number) == 1 and asp_behavior == "M":
                pipette.require_liquid_presence(src_well)
                pipette.return_tip()
                pipette.pick_up_tip()
                tip_counter += 2
            pipette.aspirate(target_ul, src_well.meniscus(SUBMERGE_MM))
        else:
            pipette.aspirate(target_ul, src_well.bottom(BOTTOM_MM))
        # DISPENSE
        if "M" in dsp_behavior:
            pipette.dispense(
                target_ul, dst_well.meniscus(SUBMERGE_MM), push_out=push_out
            )  # contact
        elif "B" in dsp_behavior:
            pipette.dispense(
                target_ul, dst_well.bottom(BOTTOM_MM), push_out=push_out
            )  # contact
        else:
            pipette.dispense(target_ul, dst_well.top(), push_out=push_out)  # top
        pipette.return_tip()
        return tip_counter

    # fill with diluent
    if not skip_diluent:
        ctx.comment("FILLING DESTINATION PLATE WITH DILUENT")
        if baseline:
            diluent_ul = 200
        for (vol, plate) in zip(volume_list, dst_labwares):
            diluent_ul = 200 - vol
            dst_labware = plate
            diluent_pipette.reset_tipracks()
            # CHECK IF THIS IS 5TH PLATE
            i = 0
            # fill with diluent
            for i in range(columns):
                if i >= columns / 2 and use_test_matrix:
                    diluent_ul = (200 / 2) - vol
                diluent_well = diluent_wells[i % len(diluent_wells_used)]
                if i < len(diluent_wells_used):
                    if diluent_pipette.has_tip:
                        diluent_pipette.return_tip()
                        diluent_pipette.pick_up_tip()
                        diluent_pipette.require_liquid_presence(diluent_well)
                if not diluent_pipette.has_tip:
                    diluent_pipette.pick_up_tip()
                diluent_pipette.aspirate(diluent_ul, diluent_well.bottom(0.5))
                diluent_pipette.dispense(
                    diluent_ul, dst_labware[f"A{i+1}"].top(), push_out=20
                )
            diluent_pipette.return_tip()
    n = 0
    dye_used = 0.0
    if not baseline:
        for (vol, dst_labware) in zip(volume_list, dst_labwares):
            for i, w in enumerate(dst_labware.wells()[:TRIALS]):
                tip_counter = _run_trial(
                    w, dye_used=dye_used, tip_counter=tip_counter, target_ul=vol
                )  # switch using LLD every-other trial
            ctx.move_labware(lids[n], dst_labware, use_gripper=True)
            n += 1
            print(f"moved lid {dst_labware}")
    diluent_tip_counter = 0
    diluent_pipette.reset_tipracks()
    n = 0
    if use_test_matrix:
        diluent_pipette.pick_up_tip()
        for (vol, dst_labware) in zip(volume_list, dst_labwares):
            columns_list = list(range(columns))
            halfway = int(len(columns_list) / 2)
            ctx.move_labware(lids[n], lids[4], use_gripper=True)
            print(f"moved_lid {dst_labware} to D4")
            for i in columns_list[halfway:]:
                diluent_ul = 200 - ((200 / 2) - vol)
                diluent_well = diluent_wells[i % len(diluent_wells_used)]
                if i < len(diluent_wells_used):
                    if diluent_pipette.has_tip:
                        diluent_pipette.return_tip()
                        diluent_tip_counter += 1
                        if diluent_tip_counter >= 12:
                            diluent_pipette.reset_tipracks()
                            diluent_tip_counter = 0
                        diluent_pipette.pick_up_tip()
                        diluent_pipette.require_liquid_presence(diluent_well)
                if not diluent_pipette.has_tip:
                    diluent_pipette.pick_up_tip()
                    diluent_tip_counter += 1
                    if diluent_tip_counter >= 12:
                        diluent_pipette.reset_tipracks()
                        diluent_tip_counter = 0
                diluent_pipette.aspirate(diluent_ul, diluent_well.bottom(0.5))
                diluent_pipette.dispense(
                    diluent_ul, dst_labware[f"A{i+1}"].top(), push_out=20
                )
            ctx.move_labware(lids[n], dst_labware, use_gripper=True)
            n += 1
