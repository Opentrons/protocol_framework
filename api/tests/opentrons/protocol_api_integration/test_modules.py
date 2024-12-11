"""Tests for modules."""

import typing
import pytest

from opentrons import simulate, protocol_api


def test_absorbance_reader_labware_load_conflict() -> None:
    """It should prevent loading a labware onto a closed absorbance reader."""
    protocol = simulate.get_protocol_api(version="2.21", robot_type="Flex")
    module = protocol.load_module("absorbanceReaderV1", "A3")

    # The lid should be treated as initially closed.
    with pytest.raises(Exception):
        module.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")

    module.open_lid()  # type: ignore[union-attr]
    # Should not raise after opening the lid.
    labware_1 = module.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")

    protocol.move_labware(labware_1, protocol_api.OFF_DECK)

    # Should raise after closing the lid again.
    module.close_lid()  # type: ignore[union-attr]
    with pytest.raises(Exception):
        module.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")


def test_absorbance_reader_labware_move_conflict() -> None:
    """It should prevent moving a labware onto a closed absorbance reader."""
    protocol = simulate.get_protocol_api(version="2.21", robot_type="Flex")
    module = protocol.load_module("absorbanceReaderV1", "A3")
    labware = protocol.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "A1")

    with pytest.raises(Exception):
        # The lid should be treated as initially closed.
        protocol.move_labware(labware, module, use_gripper=True)

    module.open_lid()  # type: ignore[union-attr]
    # Should not raise after opening the lid.
    protocol.move_labware(labware, module, use_gripper=True)

    protocol.move_labware(labware, "A1", use_gripper=True)

    # Should raise after closing the lid again.
    module.close_lid()  # type: ignore[union-attr]
    with pytest.raises(Exception):
        protocol.move_labware(labware, module, use_gripper=True)


def test_absorbance_reader_read_preconditions() -> None:
    """Test the preconditions for triggering an absorbance reader read."""
    protocol = simulate.get_protocol_api(version="2.21", robot_type="Flex")
    module = typing.cast(
        protocol_api.AbsorbanceReaderContext,
        protocol.load_module("absorbanceReaderV1", "A3"),
    )

    with pytest.raises(Exception, match="initialize"):
        module.read()  # .initialize() must be called first.

    with pytest.raises(Exception, match="close"):
        module.initialize("single", [500])  # .close_lid() must be called first.

    module.close_lid()
    module.initialize("single", [500])

    module.read()  # Should not raise now.
