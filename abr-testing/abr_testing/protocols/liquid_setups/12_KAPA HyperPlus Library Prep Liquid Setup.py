"""KAPA HyperPlus Library Preparation Liquid Setup."""
from opentrons import protocol_api
from abr_testing.protocols.helpers import (
    load_common_liquid_setup_labware_and_instruments,
)


metadata = {
    "protocolName": "PVT1ABR12: KAPA HyperPlus Library Preparation Liquid Setup",
    "author": "Rhyann Clarke <rhyann.clarke@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    """Protocol."""
    source_reservoir, p1000 = load_common_liquid_setup_labware_and_instruments(protocol)

    reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "D2")  # Reservoir
    temp_module_res = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B3"
    )
    sample_plate_1 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D3"
    )  # Sample Plate
    sample_plate_2 = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C3"
    )  # Sample Plate

    # Sample Plate 1 Prep: dispense 17 ul into column 1 total 136 ul
    p1000.transfer(
        volume=136,
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=sample_plate_1["A1"],
        blow_out=True,
        blowout_location="source well",
        trash=False,
    )

    # Sample Plate 2 Prep: dispense 17 ul into column 1 total 136 ul
    p1000.transfer(
        volume=136,
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=sample_plate_2["A1"],
        blow_out=True,
        blowout_location="source well",
        trash=False,
    )

    # Reservoir Plate Prep:
    p1000.transfer(
        volume=[1214.4, 396, 352, 352],
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=[reservoir["A1"], reservoir["A4"], reservoir["A5"], reservoir["A6"]],
        blow_out=True,
        blowout_location="source well",
        trash=False,
    )

    # Temp Module Res Prep: dispense 30 and 200 ul into columns 1 and 3 - total 1840 ul
    p1000.transfer(
        volume=[80, 88, 132, 200, 200],
        source=source_reservoir["A1"].bottom(z=0.5),
        dest=[
            temp_module_res["A1"],
            temp_module_res["A2"],
            temp_module_res["A3"],
            temp_module_res["A4"],
            temp_module_res["A5"],
        ],
        blow_out=True,
        blowout_location="source well",
        trash=False,
    )
