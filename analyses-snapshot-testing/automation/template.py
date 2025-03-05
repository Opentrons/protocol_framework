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
    source_reservoir = ctx.load_labware("nest_12_reservoir_15ml", "B2", "source")
    destination_plate = ctx.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "B3", "target")
    # water_class = ctx.define_liquid_class("water")

    ########## GENERATED LIQUID CLASS ##########
    generated_class = ctx.define_liquid_class("water")
    # WARNING: this function signature will be changing
    # props = water_class.get_for(pipette_1000, filter_tiprack_200_1)
    ##########
    # generated_class.aspirate.mix.enabled = True
    # generated_class.aspirate.pre_wet = True
    # generated_class.aspirate.retract.touch_tip.enabled = False
    # generated_class.aspirate.position_reference = "well-top"
    # generated_class.aspirate.offset = (0, 0, -40)
    # generated_class.multi_dispense.retract.touch_tip.enabled = True
    # generated_class.multi_dispense.retract.blowout.location = "destination"
    # generated_class.multi_dispense.retract.blowout.flow_rate = pipette_1000.flow_rate.blow_out
    # generated_class.multi_dispense.retract.blowout.enabled = True
    ######## END GENERATED LIQUID CLASS ##########

    # distribute_liquid variables
    volume = 49
    new_tip = "once"
    # new_tip = "always"
    source = source_reservoir.wells_by_name()["A1"]
    destination = [destination_plate.wells_by_name()[well] for well in ["A1", "A2", "A3", "A4"]]

    pipette_1000.transfer_liquid(
        liquid_class=generated_class,
        volume=volume,
        source=source,
        dest=destination,
        new_tip=new_tip,
        trash_location=trash,
    )
