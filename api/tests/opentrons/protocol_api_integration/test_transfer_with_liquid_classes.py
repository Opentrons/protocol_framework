"""Tests for the transfer APIs using liquid classes."""
import pytest
from decoy import Decoy
from opentrons_shared_data.robot.types import RobotTypeEnum

from opentrons.protocol_api import ProtocolContext
from opentrons.config import feature_flags as ff


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.20", "Flex")], indirect=True
)
def test_water_transfer(
    decoy: Decoy, mock_feature_flags: None, simulated_protocol_context: ProtocolContext
) -> None:
    """It should run the transfer steps without any errors.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    decoy.when(ff.allow_liquid_classes(RobotTypeEnum.FLEX)).then_return(True)
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.define_liquid_class("water")
    pipette_50.transfer_liquid(
        liquid_class=water,
        volume=60,
        source=nest_plate.rows()[0],
        dest=arma_plate.rows()[0],
        new_tip="always",
        trash_location=trash,
    )
    pipette_50.transfer_liquid(
        liquid_class=water,
        volume=60,
        source=nest_plate.rows()[0],
        dest=arma_plate.rows()[0],
        new_tip="per source",
        trash_location=trash,
    )
    pipette_50.pick_up_tip()
    pipette_50.transfer_liquid(
        liquid_class=water,
        volume=50,
        source=nest_plate.rows()[0],
        dest=arma_plate.rows()[0],
        new_tip="never",
        trash_location=trash,
    )
    pipette_50.drop_tip()
