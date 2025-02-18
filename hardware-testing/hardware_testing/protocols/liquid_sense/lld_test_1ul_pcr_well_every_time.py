from os import listdir

from opentrons.protocol_api import (
    ProtocolContext,
    Well,
    ParameterContext,
    OFF_DECK,
    Labware,
)
from opentrons_shared_data.load import get_shared_data_root
from hardware_testing.protocols import (
    create_dye_source_well_parameter,
)
import math

metadata = {"protocolName": "LLD 1uL PCR-to-MVS-1PAT"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": ["A3", "B2", "B3", "C1", "B4", "C4", "A4"],
    "src": "D2",
    "src_holder": "B1",
    "dst": "D3",
    "tips_200": "A2",
    "diluent_reservoir": "C2",
    "lids": "D4",
}
# OPEN AREAS C3 AND C4

TARGET_UL = 1
SUBMERGE_MM = -1.5
BOTTOM_MM = 3.0

TIP_VOLUME = 50
PIP_VOLUME = 50
DEAD_VOL_DILUENT = 3000
DEAD_VOL_DYE = 15

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
        default=2,
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
    ctx.load_trash_bin("A1")
    # Test Matrix
    test_matrix = {
        "A": {"ASP": "M_LLD", "DSP": "M", "SRC_WELL": "1"},
        "B": {"ASP": "M_LLD", "DSP": "M", "SRC_WELL": "2"},
        "C": {"ASP": "M", "DSP": "M", "SRC_WELL": "3"},
        "D": {"ASP": "M", "DSP": "M", "SRC_WELL": "4"},
        "E": {"ASP": "B", "DSP": "T", "SRC_WELL": "5"},
        "F": {"ASP": "B", "DSP": "B", "SRC_WELL": "6"},
        "G": {"ASP": "M_LLD_TIP", "DSP": "M", "SRC_WELL": "7"},
        "H": {"ASP": "M_LLD_TIP", "DSP": "M", "SRC_WELL": "8"},
    }
    plate_num_matrix = {0: "A", 1: "B", 2: "C", 3: "D", 4: "E"}
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
    # Load diluent reservoir lid
    diluent_lid = diluent_reservoir.load_labware(
        DILUENT_LABWARE, version=get_latest_version(DILUENT_LABWARE)
    )
    # diluent_reservoir_lid = diluent_reservoir.load_labware(DILUENT_LABWARE)
    pipette = ctx.load_instrument(
        f"flex_1channel_{PIP_VOLUME}", mount="left", tip_racks=tip_racks_50s
    )
    diluent_pipette = ctx.load_instrument(
        "flex_8channel_1000", mount="right", tip_racks=[tip_rack_200]
    )
    # SRC and DST labware
    src_holder = ctx.load_labware(
        "nest_96_wellplate_2ml_deep",
        location=SLOTS["src_holder"],
        version=get_latest_version("nest_96_wellplate_2ml_deep"),
    )
    # lOAD SRC LID
    src_lid = src_holder.load_labware(
        "nest_96_wellplate_2ml_deep",
        version=get_latest_version("nest_96_wellplate_2ml_deep"),
    )
    src_labware = ctx.load_labware(
        SRC_LABWARE, location=SLOTS["src"], version=get_latest_version(SRC_LABWARE)
    )

    # LOAD stack of plates and lids, lid on bottom plate on top
    lids_and_plates = [ctx.load_labware("plate_lid", SLOTS["lids"])]
    dst_labwares = []
    for i in range(num_of_plates):
        dst_labware = lids_and_plates[-1].load_labware(DST_LABWARE, version = get_latest_version(DST_LABWARE))
        lids_and_plates.append(dst_labware)
        dst_labwares.append(dst_labware)
        if i < (num_of_plates-1):
            lids_and_plates.append(lids_and_plates[-1].load_labware("plate_lid"))
    dst_labwares.reverse()
    lids_and_plates.reverse()
    # another_lid = lids_and_plates[0].load_labware("plate_lid")
    # lids_and_plates.append(another_lid)
    # DEFINE LIQUIDS #
    # DILUENT
    total_diluent_needed = 200 * TRIALS  # total diluent needed
    number_of_wells_needed = math.ceil(
        total_diluent_needed / 9000
    )  # total number of wells needed
    total_vol_per_well = (
        total_diluent_needed / number_of_wells_needed
    ) + DEAD_VOL_DILUENT
    diluent = ctx.define_liquid("diluent", "#0000FF")
    diluent_wells_used = diluent_reservoir.wells()[:number_of_wells_needed]
    diluent_reservoir.load_liquid(diluent_wells_used, total_vol_per_well, diluent)
    # DYE
    volume_list = [1.0, 1.2, 1.5, 2.0, 5.0]
    total_dye_needed = (
        sum([(vol * 24) + 10 for vol in volume_list[:num_of_plates]]) * num_of_plates
    )
    dye = ctx.define_liquid("dye", "#FF0000")
    # SOURCE WELL
    if baseline:
        # if baseline, do not load dye
        src_holder.load_empty([src_holder["A1"]])
    else:
        src_holder.load_liquid([src_holder["A1"]], total_dye_needed + 100, dye)
    for dst_labware in dst_labwares:
        if not diluent:
            # if skipping diluent step, preload with diluent
            dst_labware.load_liquid(dst_labware.wells(), 199, diluent)
        else:
            # load empty
            dst_labware.load_empty(dst_labware.wells())
    tip_counter = 0

    def fill_well_with_dye(
        plate: Labware, vol: float, plate_num: int, tip_counter: int
    ) -> int:
        """Fill plate with dye from source."""
        ctx.move_labware(
            src_lid, diluent_lid, use_gripper=True
        )  # move lid off of source plate
        dye_needed_in_well = (vol * columns) + DEAD_VOL_DYE
        well_letter = plate_num_matrix[plate_num]
        src_wells = [src_labware[f"{well_letter}{src_well+1}"] for src_well in range(len(test_matrix))]
        pipette.configure_for_volume(dye_needed_in_well)
        pipette.pick_up_tip()
        num_of_transfers = 1
        for src_well in src_wells:
            if dye_needed_in_well > pipette.max_volume:
                dye_needed_in_well = dye_needed_in_well / 2
                num_of_transfers = 2
            for i in range(num_of_transfers):
                pipette.aspirate(dye_needed_in_well, src_holder["A1"])
                pipette.dispense(dye_needed_in_well, src_well)
        pipette.drop_tip()
        tip_counter += 1
        ctx.move_labware(
            src_lid, src_holder, use_gripper=True
        )  # put lid back on source plate
        return tip_counter

    def fill_plate_with_diluent(
        plate: Labware, baseline: bool, initial_fill: bool, vol: float
    ) -> None:
        """Fill plate with diluent."""
        # fill with diluent
        if initial_fill:
            print(f"--------------plate in loop {n}")
        ctx.move_labware(
            diluent_lid, src_lid, use_gripper=True
        )  # move lid off diluent reservoir
        ctx.comment("FILLING DESTINATION PLATE WITH DILUENT")
        columns_list = plate.columns()[:columns]
        if baseline:
            diluent_ul = 200
            halfway = 0  # start at beginning
        elif initial_fill:
            diluent_ul = 200 - vol
            print(f"initial {diluent_ul}")
            halfway = 0  # start at beginning
        else:
            diluent_ul = 200 - ((200 / 2) - vol)
            print("remaining diluent {diluent_ul}")
            halfway = int(len(columns_list) / 2)  # start halfway through the plate
        diluent_pipette.pick_up_tip()
        for i in columns_list[halfway:]:
            i_index = columns_list.index(i)
            if (
                columns_list.index(i) >= int(len(columns_list) / 2)
                and use_test_matrix
                and initial_fill
            ):
                diluent_ul = (200 / 2) - vol
            diluent_well = diluent_wells_used[i_index % len(diluent_wells_used)]
            diluent_pipette.aspirate(diluent_ul, diluent_well.bottom(0.5))
            diluent_pipette.dispense(
                diluent_ul, plate[f"A{i_index+1}"].top(), push_out=20
            )
            dst_well = plate[f"A{i_index + 1}"]
        diluent_pipette.drop_tip()
        ctx.move_labware(
            diluent_lid, diluent_reservoir, use_gripper=True
        )  # put lid back on diluent reservoir

    def _run_trial(
        dst_well: Well,
        tip_counter: int,
        target_ul: float,
        plate_num: int,
    ) -> int:
        # change tip before every aspirate
        well_name_letter = dst_well.well_name[0]
        well_number = dst_well.well_name[1]
        asp_behavior = test_matrix[well_name_letter]["ASP"]
        dsp_behavior = test_matrix[well_name_letter]["DSP"]
        src_well_num = test_matrix[well_name_letter]["SRC_WELL"]
        src_well_letter = plate_num_matrix[n]
        src_well_str = src_well_letter + str(src_well_num)
        src_well = src_labware[src_well_str]
        if tip_counter > (4*96):
            # if 4 tip racks have been used, switch out two of them
            # tip rack a3 goes to d3
            ctx.move_labware(tip_racks_50s[0], "D3", use_gripper=True)
            # tip rack b4 goes to a3
            ctx.move_labware(tip_racks_50s[4], SLOTS["tips"][0], use_gripper=True)
            # tip rack d3 goes to b4
            ctx.move_labware(tip_racks_50s[0], SLOTS["tips"][4], use_gripper=True)
            # tip rack b2 goes to d3
            ctx.move_labware(tip_racks_50s[1], "D3", use_gripper=True)
            # tip rack c4 goes to b2
            ctx.move_labware(tip_racks_50s[5], SLOTS["tips"][1], use_gripper=True)
            # tip rack d3 goes to c4
            ctx.move_labware(tip_racks_50s[1], SLOTS["tips"][5], use_gripper = True)
            # tip rack b3 goes to d3
            ctx.move_labware(tip_racks_50s[2], "D3", use_gripper = True)
            ctx.move_labware(tip_racks_50s[6], SLOTS["tips"][2], use_gripper = True)
            ctx.move_labware(tip_racks_50s[2], SLOTS["tips"][6], use_gripper = True)
            
            tip_counter = 0
        tip_counter += 1
        pipette.pick_up_tip()
        if "LLD" in asp_behavior:
            pipette.require_liquid_presence(src_well)
            if "T" in asp_behavior:
                # switch tip
                pipette.drop_tip()
                pipette.pick_up_tip()
                tip_counter += 1
        pipette.configure_for_volume(target_ul)
        # ASPIRATE
        if "M" in asp_behavior:
            # NOTE: if liquid height is <2.5mm, protocol may error out
            #       this can be avoided by adding extra starting liquid in the SRC labware
            # need to probe new well before doing meniscus relative
            if (dst_well.well_name == "C1"  or dst_well.well_name == "D1") and asp_behavior == "M":
                pipette.require_liquid_presence(src_well)
                pipette.drop_tip()
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
        pipette.drop_tip()
        return tip_counter
    n = 0
    if not skip_diluent:
        for (vol, plate) in zip(volume_list, dst_labwares):
            lid_for_plate = plate.parent
            if tip_counter >= ((4*96)-10):
                # if 4 tip racks have been used, switch out two of them
                print("started moving tip racks before plate move")
                # tip rack a3 goes to d3
                ctx.move_labware(tip_racks_50s[0], "D3", use_gripper=True)
                # tip rack b4 goes to a3
                ctx.move_labware(tip_racks_50s[4], SLOTS["tips"][0], use_gripper=True)
                # tip rack d3 goes to b4
                ctx.move_labware(tip_racks_50s[0], SLOTS["tips"][4], use_gripper=True)
                # tip rack b2 goes to d3
                ctx.move_labware(tip_racks_50s[1], "D3", use_gripper=True)
                # tip rack c4 goes to b2
                ctx.move_labware(tip_racks_50s[5], SLOTS["tips"][1], use_gripper=True)
                # tip rack d3 goes to c4
                ctx.move_labware(tip_racks_50s[1], SLOTS["tips"][5], use_gripper = True)
                # tip rack b3 goes to d3
                ctx.move_labware(tip_racks_50s[2], "D3", use_gripper = True)
                ctx.move_labware(tip_racks_50s[6], SLOTS["tips"][2], use_gripper = True)
                ctx.move_labware(tip_racks_50s[2], SLOTS["tips"][6], use_gripper = True)
                
                tip_counter = 0
            ctx.move_labware(plate, "D3", use_gripper = True)
            # FILL PLATE WITH DILUENT
            fill_plate_with_diluent(
                plate=plate, baseline=baseline, initial_fill=True, vol=vol
            )
            if not baseline:
                # FILL SOURCE PLATE WITH DYE
                tip_counter = fill_well_with_dye(
                    plate=plate, vol=vol, plate_num=n, tip_counter=tip_counter
                )
                for i, w in enumerate(plate.wells()[: columns * 8]):
                    # FILL DESTINATION PLATE WITH DYE
                    tip_counter = _run_trial(
                        w,
                        tip_counter=tip_counter,
                        target_ul=vol,
                        plate_num=n,
                    )
            # FILL REMAINING COLUMNS WITH DILUENT
            fill_plate_with_diluent(
                plate=plate, baseline=baseline, initial_fill=False, vol=vol
            )
            if n == 0:
                # if first plate, move to slot D1
                ctx.move_labware(plate, "D1", use_gripper = True)
            else:
                # for all other plates, stack on previous lid
                ctx.move_labware(plate, previous_lid, use_gripper = True)
            # move lid onto plate
            if n != (num_of_plates - 1):
                ctx.move_labware(lid_for_plate, plate, use_gripper=True)
                # assign lid on plate to next lid to stack to
                previous_lid = lid_for_plate
                n += 1
