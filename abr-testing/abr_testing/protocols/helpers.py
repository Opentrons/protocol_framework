"""Helper functions commonly used in protocols."""

from opentrons.protocol_api import ProtocolContext, Labware, InstrumentContext
from typing import Tuple


def load_common_liquid_setup_labware_and_instruments(
    protocol: ProtocolContext,
) -> Tuple[Labware, InstrumentContext]:
    """Load Commonly used Labware and Instruments."""
    # Tip rack
    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    # Pipette
    p1000 = protocol.load_instrument(
        instrument_name="flex_8channel_1000", mount="left", tip_racks=[tip_rack]
    )
    # Source_reservoir
    source_reservoir = protocol.load_labware("axygen_1_reservoir_90ml", "C2")
    return source_reservoir, p1000
