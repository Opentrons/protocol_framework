"""Plate Filler Protocol for Simple Normalize Long."""
from opentrons import protocol_api
from abr_testing.protocols.helpers import (
    load_common_liquid_setup_labware_and_instruments,
)

metadata = {
    "protocolName": "DVT1ABR3 Liquids: Flex Normalize with Tubes",
    "author": "Rhyann clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol."""
    # Initiate Labware
    (
        source_reservoir,
        tip_rack,
        p1000,
    ) = load_common_liquid_setup_labware_and_instruments(protocol)
    reagent_tube = protocol.load_labware(
        "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical", "D3", "Reagent Tube"
    )
    p1000.configure_nozzle_layout(
        style=protocol_api.SINGLE, start="H1", tip_racks=[tip_rack]
    )
    # Transfer Liquid
    p1000.transfer(
        4000,
        source_reservoir["A1"],
        reagent_tube["A1"].top(),
        blowout=True,
        blowout_location="source well",
    )
