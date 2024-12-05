"""Plate Filler Protocol for Immunoprecipitation by Dynabeads."""
from opentrons import protocol_api
from abr_testing.protocols.helpers import (
    load_common_liquid_setup_labware_and_instruments,
)


metadata = {
    "protocolName": "PVT1ABR11 Liquids: Immunoprecipitation by Dynabeads - 96-well",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol."""
    # Deck Setup
    (
        source_reservoir,
        tip_rack,
        p1000,
    ) = load_common_liquid_setup_labware_and_instruments(protocol)

    reservoir_wash = protocol.load_labware("nest_12_reservoir_15ml", "D2", "Reservoir")
    sample_plate = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "C3", "Sample Plate"
    )

    columns = [
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "A6",
        "A7",
        "A8",
        "A9",
        "A10",
        "A11",
        "A12",
    ]
    # 1 column 6000 uL
    p1000.pick_up_tip()
    for i in columns:
        p1000.aspirate(750, source_reservoir["A1"].bottom(z=0.5))
        p1000.dispense(750, reservoir_wash[i].top())
        p1000.blow_out(location=source_reservoir["A1"].top())
    p1000.return_tip()
    # Nest 96 Deep Well Plate 2 mL: 250 uL per well
    p1000.pick_up_tip()
    for n in columns:
        p1000.aspirate(250, source_reservoir["A1"].bottom(z=0.5))
        p1000.dispense(250, sample_plate[n].bottom(z=1))
        p1000.blow_out(location=source_reservoir["A1"].top())
    p1000.return_tip()
