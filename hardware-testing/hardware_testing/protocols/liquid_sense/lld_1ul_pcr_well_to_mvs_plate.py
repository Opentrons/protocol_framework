from opentrons.protocol_api import ProtocolContext

SLOTS = {
    "tips": "D2",
    "pcr": "C2",
    "mvs": "C1"
}

SUBMERGE_MM = -1.5
TARGET_UL = 1
TRIALS = 48
SRC_WELL = "A1"
DILUENT_UL = max(0, 200 - TARGET_UL)


def run(ctx: ProtocolContext) -> None:
    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_50ul",
                                location=SLOTS["tips"],
                                version=1)
    pipette = ctx.load_instrument("flex_1channel_50",
                                  mount="left",
                                  liquid_presence_detection=True,  # ALWAYS run LLD before aspirate
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

    pipette.pick_up_tip()
    for trial in range(TRIALS):
        pipette.aspirate(TARGET_UL, pcr_plate[SRC_WELL].meniscus(SUBMERGE_MM))
        pipette.dispense(TARGET_UL, mvs_plate.wells()[trial].meniscus())
    pipette.drop_tip()
