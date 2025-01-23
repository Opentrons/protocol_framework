from opentrons.protocol_api import ProtocolContext, InstrumentContext
from opentrons_shared_data.pipette.load_data import load_definition
from opentrons_shared_data.pipette.types import (
    PipetteChannelType,
    PipetteModelType,
    PipetteVersionType,
    PipetteOEMType,
)

# MATERIALS:
#  - 8ch manual pipette
#  - P50S
#  - 50uL tip-rack
#  - Red dye (ideally Range D)
#  - Diluent (or water)
#  - PCR plate
#  - MVS plate

metadata = {"protocolName": "LLD 1uL PCR-to-MVS"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": "C3",
    "mvs": "D3",
    "pcr": "D2",
}

SUBMERGE_MM = -1.5
TARGET_UL = 1
TRIALS = 48
SRC_WELL = "H1"
DILUENT_UL = max(0, 200 - TARGET_UL)
TIP_VOLUME = 50
PIP_VOLUME = 50
LOWEST_POSSIBLE_TIP_MM = 0.5


def _get_lld_min_height(pipette: InstrumentContext) -> float:
    pip_model_list = pipette.model.split("_")
    pip_def = load_definition(
        model=PipetteModelType(pip_model_list[0]),
        channels=PipetteChannelType(pipette.channels),
        version=PipetteVersionType(
            major=int(pip_model_list[-1][-3]),  # type: ignore[arg-type]
            minor=int(pip_model_list[-1][-1]),  # type: ignore[arg-type]
        ),
        oem=PipetteOEMType.EM if "em" in pipette.model else PipetteOEMType.OT,
    )
    return pip_def.lld_settings[f"t{TIP_VOLUME}"]["minHeight"]


def run(ctx: ProtocolContext) -> None:
    ctx.load_trash_bin("A3")
    tip_rack = ctx.load_labware(f"opentrons_flex_96_tiprack_{TIP_VOLUME}ul",
                                location=SLOTS["tips"],
                                version=1)
    pipette = ctx.load_instrument(f"flex_1channel_{PIP_VOLUME}",
                                  mount="left",
                                  tip_racks=[tip_rack])
    pcr_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt",
                                 location=SLOTS["pcr"],
                                 version=3)
    mvs_plate = ctx.load_labware("corning_96_wellplate_360ul_flat",
                                 location=SLOTS["mvs"],
                                 version=3)
    diluent = ctx.define_liquid("diluent", "#0000FF")
    dye = ctx.define_liquid("dye", "#FF0000")
    mvs_plate.load_liquid(mvs_plate.wells(), DILUENT_UL, diluent)
    pcr_plate.load_empty([w for w in pcr_plate.wells() if w.well_name != SRC_WELL])
    pcr_plate.load_liquid([pcr_plate[SRC_WELL]], TARGET_UL * TRIALS, dye)

    min_aspirate_mm = _get_lld_min_height(pipette) - SUBMERGE_MM
    meniscus_relative = True
    for trial in range(TRIALS):
        pipette.pick_up_tip()
        if meniscus_relative:
            pipette.require_liquid_presence(pcr_plate[SRC_WELL])
        liquid_mm = pcr_plate[SRC_WELL]._core.  # TODO: get height of Liquid
        if liquid_mm <= min_aspirate_mm:
            meniscus_relative = False
            src = pcr_plate[SRC_WELL].bottom(LOWEST_POSSIBLE_TIP_MM)
        elif liquid_mm > LOWEST_POSSIBLE_TIP_MM:
            src = pcr_plate[SRC_WELL].meniscus(SUBMERGE_MM)
        else:
            pipette.drop_tip()
            break
        pipette.aspirate(TARGET_UL, src)
        pipette.dispense(TARGET_UL, mvs_plate.wells()[trial].meniscus())
        pipette.drop_tip()
