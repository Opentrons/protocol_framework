requirements = {"robotType": "Flex", "apiLevel": "2.23"}
metadata = {"protocolName": "P1000 1ch distribute_liquid"}


def run(ctx):  # type: ignore
    filter_tiprack_200_1 = ctx.load_labware("opentrons_flex_96_filtertiprack_200ul", "A1")
    filter_tiprack_200_2 = ctx.load_labware("opentrons_flex_96_filtertiprack_200ul", "B1")
    filter_tiprack_200_3 = ctx.load_labware("opentrons_flex_96_filtertiprack_200ul", "C1")
    filter_tiprack_200_4 = ctx.load_labware("opentrons_flex_96_filtertiprack_200ul", "D1")
    pipette_1000 = ctx.load_instrument(
        "flex_1channel_1000", "right", tip_racks=[filter_tiprack_200_1, filter_tiprack_200_2, filter_tiprack_200_3, filter_tiprack_200_4]
    )
    trash = ctx.load_trash_bin("A3")
    source_reservoir = ctx.load_labware("nest_96_wellplate_2ml_deep", "B2", "source")
    # what is the list of labware to use for source and destination?
    # exclude labware that does not allow touchtip for now
    destination_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "B3", "target")

    generated_class = ctx.define_liquid_class("water")
    # WARNING: this function signature will be changing
    liquid_class_config = generated_class.get_for(pipette_1000, filter_tiprack_200_1)  # noqa: F841
    ########## GENERATED LIQUID CLASS ##########
    ######## END GENERATED LIQUID CLASS ##########
    # distribute_liquid variables
    volume = 273
    # new_tip = "once"
    new_tip = "always"
    # source = source_reservoir.wells_by_name()["A1"]
    source = [source_reservoir.wells_by_name()[well] for well in ["A1", "A2", "A3", "A4"]]
    # destination = [destination_plate.wells_by_name()[well] for well in ["A1", "A2", "A3", "A4"]]
    destination = destination_plate.wells_by_name()["A1"]
    pipette_1000.consolidate_liquid(
        liquid_class=generated_class,
        volume=volume,
        source=source,
        dest=destination,
        new_tip=new_tip,
        trash_location=trash,
    )
