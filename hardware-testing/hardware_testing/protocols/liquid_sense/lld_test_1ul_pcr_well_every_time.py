from os import listdir

from opentrons.protocol_api import ProtocolContext, Well
from opentrons_shared_data.load import get_shared_data_root


metadata = {"protocolName": "LLD 1uL PCR-to-MVS"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": "C3",
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
    pipette = ctx.load_instrument(
        f"flex_1channel_{PIP_VOLUME}", mount="left", tip_racks=[tip_rack]
    )

    # SRC and DST labware
    src_labware = ctx.load_labware(
        SRC_LABWARE, location=SLOTS["src"], version=get_latest_version(SRC_LABWARE)
    )
    dst_labware = ctx.load_labware(
        DST_LABWARE, location=SLOTS["dst"], version=get_latest_version(DST_LABWARE)
    )

    # define starting liquid volumes
    diluent = ctx.define_liquid("diluent", "#0000FF")
    dye = ctx.define_liquid("dye", "#FF0000")
    dst_labware.load_liquid(dst_labware.wells(), DILUENT_UL, diluent)
    src_labware.load_empty([w for w in src_labware.wells() if w.well_name != SRC_WELL])
    src_labware.load_liquid([src_labware[SRC_WELL]], TARGET_UL * TRIALS, dye)

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
        pipette.drop_tip()

    for i, w in enumerate(dst_labware.wells()[:TRIALS]):
        _run_trial(w, use_lld=bool((i % 2) == 0))  # switch using LLD every-other trial
