from os import listdir

from opentrons.protocol_api import ProtocolContext, Well
from opentrons_shared_data.load import get_shared_data_root


metadata = {"protocolName": "LLD 1uL PCR-to-MVS-SUBMERGE-8"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": "C2",
    "src": "D2",
    "dst": "D3",
}

TARGET_UL = 1
SUBMERGE_MM = -1.5
BOTTOM_MM = 3.0
TRIALS = int(96 / 4)  # define number of trials based on how to slice up the DST plate
DILUENT_UL = max(0, 200 - TARGET_UL)

TIP_VOLUME = 50
PIP_VOLUME = 50

SRC_WELL = "H1"
SRC_LABWARE = "opentrons_96_wellplate_200ul_pcr_full_skirt"
DST_LABWARE = "corning_96_wellplate_360ul_flat"
DILUENT_LABWARE = "nest_12_reservoir_15ml"


def get_latest_version(load_name: str) -> int:
    labware_def_location = (
        f"{get_shared_data_root()}/labware/definitions/3/{load_name}/"
    )
    labware_def_latest = sorted(listdir(labware_def_location))[-1]
    return int(labware_def_latest[0])


def run(ctx: ProtocolContext) -> None:
    ctx.load_trash_bin("A3")
    tip_rack = ctx.load_labware(
        f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul", location=SLOTS["tips"], version=1
    )
    tip_rack_200 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", location = "B3")
    diluent_reservoir = ctx.load_labware(DILUENT_LABWARE, location = "C3", version=get_latest_version(DILUENT_LABWARE))
    pipette = ctx.load_instrument(
        f"flex_1channel_{PIP_VOLUME}", mount="left", tip_racks=[tip_rack]
    )
    diluent_pipette = ctx.load_instrument("flex_8channel_1000", mount = "right", tip_racks = [tip_rack_200])
    # SRC and DST labware
    src_labware = ctx.load_labware(
        SRC_LABWARE, location=SLOTS["src"], version=get_latest_version(SRC_LABWARE)
    )
    dst_labware = ctx.load_labware(
        DST_LABWARE, location=SLOTS["dst"], version=get_latest_version(DST_LABWARE)
    )

    # define starting liquid volumes
    # load diluent wells
    diluent = ctx.define_liquid("diluent", "#0000FF")
    diluent_wells = [diluent_reservoir["A1"], diluent_reservoir["A2"]]
    diluent_reservoir.load_liquid(diluent_wells, 12000, diluent)
    # load dye
    dye = ctx.define_liquid("dye", "#FF0000")
    src_labware.load_empty([w for w in src_labware.wells() if w.well_name != SRC_WELL])
    src_labware.load_liquid([src_labware[SRC_WELL]], TARGET_UL * TRIALS, dye)
    dst_labware.load_empty(dst_labware.wells())
    

    src_well = src_labware[SRC_WELL]

    def _run_trial(dst_well: Well, use_lld: bool) -> None:
        # change tip before every aspirate
        
        pipette.pick_up_tip()
        pipette.liquid_presence_detection = use_lld
        if use_lld:
            # NOTE: if liquid height is <2.5mm, protocol may error out
            #       this can be avoided by adding extra starting liquid in the SRC labware
            pipette.aspirate(TARGET_UL, src_well.meniscus(SUBMERGE_MM))
        else:
            pipette.aspirate(TARGET_UL, src_well.bottom(BOTTOM_MM))
        pipette.dispense(TARGET_UL, dst_well.meniscus(SUBMERGE_MM))  # contact
        pipette.return_tip()
        
    # fill with diluent
    ctx.comment("FILLING DESTINATION PLATE WITH DILUENT")


    for i in range(int(TRIALS/8)):
        diluent_well = diluent_wells[ i % len(diluent_wells)]
        if i < len(diluent_wells):
            if diluent_pipette.has_tip:
                diluent_pipette.return_tip()
            diluent_pipette.pick_up_tip()
            diluent_pipette.require_liquid_presence(diluent_well)
        diluent_pipette.aspirate(DILUENT_UL, diluent_well.meniscus(-8))
        diluent_pipette.dispense(DILUENT_UL, dst_labware[f"A{i+1}"].top(), push_out = 20)
        
    diluent_pipette.return_tip()
    for i, w in enumerate(dst_labware.wells()[:TRIALS]):
        _run_trial(w, use_lld=bool((i % 2) == 0))  # switch using LLD every-other trial
