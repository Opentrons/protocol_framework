requirements = {"robotType": "Flex", "apiLevel": "2.23"}
metadata = {"protocolName": "Many-to-many transfer with new tip always"}


def run(protocol_context):
    tiprack1 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "C1")
    trash = protocol_context.load_trash_bin("A3")
    pipette_50 = protocol_context.load_instrument("flex_1channel_1000", "right", tip_racks=[tiprack1])

    nest_plate = protocol_context.load_labware("nest_96_wellplate_100ul_pcr_full_skirt", "D3")
    arma_plate = protocol_context.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "D2")

    water_class = protocol_context.define_liquid_class("water")
    pipette_50.transfer_liquid(
        liquid_class=water_class,
        volume=30,
        source=nest_plate.rows()[0][4:7],
        dest=arma_plate.rows()[0][4:7],
        new_tip="always",
        trash_location=trash,
    )
