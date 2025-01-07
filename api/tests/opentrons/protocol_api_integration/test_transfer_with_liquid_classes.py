"""Tests for the transfer APIs using liquid classes."""
import mock
import pytest
from decoy import Decoy
from opentrons_shared_data.robot.types import RobotTypeEnum

from opentrons.protocol_api import ProtocolContext
from opentrons.config import feature_flags as ff
from opentrons.protocol_api.core.engine import InstrumentCore


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

    with mock.patch.object(
        InstrumentCore, 'pick_up_tip', side_effect=InstrumentCore.pick_up_tip, autospec=True,
    ) as patched_pick_up_tip, mock.patch.object(
        InstrumentCore, 'aspirate', side_effect=InstrumentCore.aspirate, autospec=True,
    ) as patched_aspirate, mock.patch.object(
        InstrumentCore, 'dispense', side_effect=InstrumentCore.dispense, autospec=True,
    ) as patched_dispense:

        # This mock manager gathers up the calls to the different mocks so that we can inspect the order of calls.
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, 'pick_up_tip')
        mock_manager.attach_mock(patched_aspirate, 'aspirate')
        mock_manager.attach_mock(patched_dispense, 'dispense')

        pipette_50.transfer_liquid(
            liquid_class=water,
            volume=60,
            source=nest_plate.rows()[0],
            dest=arma_plate.rows()[0],
            new_tip="always",
            trash_location=trash,
        )

        # You can check that a specific function was called some number of times, like this:
        assert patched_pick_up_tip.call_count == 24

        # You can also validate the sequence of calls across all the patched functions:
        # FYI: THIS IS A BAD UNIT TEST BECAUSE IT'S WAY TOO LONG FOR A HUMAN TO READ,
        # BUT YOU COULD DO THIS IF YOU REALLY WANTED TO:
        assert mock_manager.mock_calls == [
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
            mock.call.pick_up_tip(mock.ANY, location=mock.ANY, well_core=mock.ANY, presses=mock.ANY, increment=mock.ANY),
            mock.call.aspirate(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=29.5, in_place=True, is_meniscus=None),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=0.1, rate=1, flow_rate=0.1, in_place=mock.ANY, is_meniscus=mock.ANY, push_out=0),
            mock.call.dispense(mock.ANY, location=mock.ANY, well_core=mock.ANY, volume=30., rate=1, flow_rate=50., in_place=mock.ANY, is_meniscus=mock.ANY, push_out=2),
        ]

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
