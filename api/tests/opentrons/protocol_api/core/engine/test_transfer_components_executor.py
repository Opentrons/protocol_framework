"""Tests for complex commands executor."""
import pytest
from decoy import Decoy
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    LiquidClassSchemaV1,
)

from opentrons.protocol_api._liquid import LiquidClass
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons.protocol_api.core.engine.well import WellCore
from opentrons.protocol_api.core.engine.instrument import InstrumentCore
from opentrons.protocol_api.core.engine.transfer_components_executor import (
    TransferComponentsExecutor,
)
from opentrons.types import Location, Point


@pytest.fixture
def mock_instrument_core(decoy: Decoy) -> InstrumentCore:
    """Return a mocked out instrument core."""
    return decoy.mock(cls=InstrumentCore)


@pytest.fixture
def sample_transfer_props(
    maximal_liquid_class_def: LiquidClassSchemaV1,
) -> TransferProperties:
    """Return a mocked out liquid class fixture."""
    return LiquidClass.create(maximal_liquid_class_def).get_for(
        pipette="flex_1channel_50", tiprack="opentrons_flex_96_tiprack_50ul"
    )


""" Test aspirate properties:
"submerge": {
  "positionReference": "well-top",
  "offset": {"x": 1, "y": 2, "z": 3},
  "speed": 100,
  "delay": {"enable": true, "params": {"duration": 10.0}}},
"retract": {
  "positionReference": "well-top",
  "offset": {"x": 3, "y": 2, "z": 1},
  "speed": 50,
  "airGapByVolume": [[1.0, 0.1], [49.9, 0.1], [50.0, 0.0]],
  "touchTip": {"enable": false, "params": {"zOffset": -1, "mmToEdge": 0.5, "speed": 30}},
  "delay": {"enable": false, "params": {"duration": 0}}},
"positionReference": "well-bottom",
"offset": {"x": 10, "y": 20, "z": 30},
"flowRateByVolume": [[1.0, 35.0], [10.0, 24.0], [50.0, 35.0]],
"correctionByVolume": [[0.0, 0.0]],
"preWet": true,
"mix": {"enable": true, "params": {"repetitions": 1, "volume": 50}},
"delay": {"enable": true, "params": {"duration": 0.2}}
"""


def test_submerge(
    decoy: Decoy,
    mock_instrument_core: InstrumentCore,
    sample_transfer_props: TransferProperties,
) -> None:
    """Should perform the expected aspiration steps."""
    source_well = decoy.mock(cls=WellCore)
    well_top_point = Point(1, 2, 3)
    well_bottom_point = Point(4, 5, 6)
    air_gap_removal_flow_rate = (
        sample_transfer_props.dispense.flow_rate_by_volume.get_for_volume(123)
    )

    subject = TransferComponentsExecutor(
        instrument_core=mock_instrument_core,
        transfer_properties=sample_transfer_props,
        target_location=Location(Point(), labware=None),
        target_well=source_well,
    )
    decoy.when(source_well.get_bottom(0)).then_return(well_bottom_point)
    decoy.when(source_well.get_top(0)).then_return(well_top_point)

    subject.submerge(
        submerge_properties=sample_transfer_props.aspirate.submerge,
        air_gap_volume=123,
    )

    decoy.verify(
        mock_instrument_core.move_to(
            location=Location(Point(x=2, y=4, z=6), labware=None),
            well_core=source_well,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        ),
        mock_instrument_core.dispense(
            location=Location(Point(x=2, y=4, z=6), labware=None),
            well_core=None,
            volume=123,
            rate=1,
            flow_rate=air_gap_removal_flow_rate,
            in_place=True,
            is_meniscus=None,
            push_out=0,
        ),
        mock_instrument_core.delay(0.2),
        mock_instrument_core.move_to(
            location=Location(Point(), labware=None),
            well_core=source_well,
            force_direct=True,
            minimum_z_height=None,
            speed=100,
        ),
        mock_instrument_core.delay(10),
    )
