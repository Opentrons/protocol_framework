"""Tests for the APIs around liquid classes."""
import pytest
from decoy import Decoy
from opentrons_shared_data.robot.types import RobotTypeEnum

from opentrons.protocol_api import ProtocolContext
from opentrons.config import feature_flags as ff


@pytest.mark.ot2_only
@pytest.mark.parametrize("protocol", [("2.20", "OT-2")], indirect=True)
def test_liquid_class_creation_and_property_fetching(
    decoy: Decoy,
    mock_feature_flags: None,
    protocol: ProtocolContext,
) -> None:
    """It should create the liquid class and provide access to its properties."""
    decoy.when(ff.allow_liquid_classes(RobotTypeEnum.OT2)).then_return(True)
    pipette_left = protocol.load_instrument("p20_single_gen2", mount="left")
    pipette_right = protocol.load_instrument("p300_multi", mount="right")
    tiprack = protocol.load_labware("opentrons_96_tiprack_20ul", "1")

    glycerol_50 = protocol.define_liquid_class("fixture_glycerol50")

    assert glycerol_50.name == "fixture_glycerol50"
    assert glycerol_50.display_name == "Glycerol 50%"

    # TODO (spp, 2024-10-17): update this to use pipette's load name instead of pipette.name
    assert (
        glycerol_50.get_for(
            pipette_left.name, tiprack.load_name
        ).dispense.flow_rate_by_volume.default
        == 50
    )
    assert (
        glycerol_50.get_for(
            pipette_left.name, tiprack.load_name
        ).aspirate.submerge.speed
        == 100
    )

    with pytest.raises(
        ValueError,
        match="No properties found for p300_multi in fixture_glycerol50 liquid class",
    ):
        glycerol_50.get_for(pipette_right.name, tiprack.load_name)

    with pytest.raises(AttributeError):
        glycerol_50.name = "foo"  # type: ignore

    with pytest.raises(AttributeError):
        glycerol_50.display_name = "bar"  # type: ignore

    with pytest.raises(ValueError, match="Liquid class definition not found"):
        protocol.define_liquid_class("non-existent-liquid")


@pytest.mark.parametrize("protocol", [("2.20", "OT-2")], indirect=True)
def test_liquid_class_feature_flag(protocol: ProtocolContext) -> None:
    """It should raise a not implemented error without the allowLiquidClass flag set."""
    with pytest.raises(NotImplementedError):
        protocol.define_liquid_class("fixture_glycerol50")
