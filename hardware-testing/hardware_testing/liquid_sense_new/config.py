"""Config."""
from typing import Dict, Any

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION

from hardware_testing.protocols.liquid_sense_lpc import (
    liquid_sense_ot3_p50_single_vial,
    liquid_sense_ot3_p50_multi_vial,
    liquid_sense_ot3_p200_96_vial,
    liquid_sense_ot3_p1000_96_vial,
    liquid_sense_ot3_p1000_single_vial,
    liquid_sense_ot3_p1000_multi_vial,
)


API_LEVEL = str(MAX_SUPPORTED_VERSION)

LIQUID_SENSE_CFG: Dict[int, Dict[int, Any]] = {
    50: {
        1: liquid_sense_ot3_p50_single_vial,
        8: liquid_sense_ot3_p50_multi_vial,
    },
    200: {
        96: liquid_sense_ot3_p200_96_vial,
    },
    1000: {
        1: liquid_sense_ot3_p1000_single_vial,
        8: liquid_sense_ot3_p1000_multi_vial,
        96: liquid_sense_ot3_p1000_96_vial,
    },
}

PIPETTE_MODEL_NAME = {
    50: {
        1: "p50_single_flex",
        8: "p50_multi_flex",
    },
    1000: {
        1: "p1000_single_flex",
        8: "p1000_multi_flex",
        96: "p1000_96_flex",
    },
    200: {96: "p200_96_flex"},
}
