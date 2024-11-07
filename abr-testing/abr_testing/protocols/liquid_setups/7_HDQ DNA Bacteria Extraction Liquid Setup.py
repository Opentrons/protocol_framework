"""Plate Filler Protocol for HDQ DNA Bacteria Extraction."""
from opentrons import protocol_api
from abr_testing.protocols.helpers import (
    load_common_liquid_setup_labware_and_instruments,
)


metadata = {
    "protocolName": "PVT1ABR7 Liquids: HDQ DNA Bacteria Extraction",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol."""
    # Deck Setup
    (
        source_reservoir,
        tip_rack,
        p1000,
    ) = load_common_liquid_setup_labware_and_instruments(protocol)

    sample_plate = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "C3", "Sample Plate"
    )
    elution_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B3", "Elution Plate"
    )
    res1 = protocol.load_labware("nest_12_reservoir_15ml", "D2", "reagent reservoir 1")
    # Label Reservoirs
    well1 = res1["A1"].top()
    well3 = res1["A3"].top()
    well4 = res1["A4"].top()
    well7 = res1["A7"].top()
    well10 = res1["A10"].top()

    # Volumes
    wash = 600
    al_and_pk = 468
    beads_and_binding = 552

    # Sample Plate
    p1000.transfer(
        volume=180,
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=sample_plate["A1"].top(),
        blowout=True,
        blowout_location="source well",
        trash=False,
    )
    # Elution Plate
    p1000.transfer(
        volume=100,
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=elution_plate["A1"].top(),
        blowout=True,
        blowout_location="source well",
        trash=False,
    )
    # Res 1
    p1000.transfer(
        volume=[beads_and_binding, al_and_pk, wash, wash, wash],
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=[well1, well3, well4, well7, well10],
        blowout=True,
        blowout_location="source well",
        trash=False,
    )
