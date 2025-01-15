"""Tests for Protocol API Flex Stacker contexts."""
import pytest
from decoy import Decoy

from opentrons.legacy_broker import LegacyBroker
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocol_api import FlexStackerContext, Labware
from opentrons.protocol_api.core.common import (
    ProtocolCore,
    LabwareCore,
    FlexStackerCore,
)
from opentrons.protocol_api.core.core_map import LoadedCoreMap


@pytest.fixture
def mock_core(decoy: Decoy) -> FlexStackerCore:
    """Get a mock module implementation core."""
    return decoy.mock(cls=FlexStackerCore)


@pytest.fixture
def mock_protocol_core(decoy: Decoy) -> ProtocolCore:
    """Get a mock protocol implementation core."""
    return decoy.mock(cls=ProtocolCore)


@pytest.fixture
def mock_labware_core(decoy: Decoy) -> LabwareCore:
    """Get a mock labware implementation core."""
    mock_core = decoy.mock(cls=LabwareCore)
    decoy.when(mock_core.get_well_columns()).then_return([])
    return mock_core


@pytest.fixture
def mock_core_map(decoy: Decoy) -> LoadedCoreMap:
    """Get a mock LoadedCoreMap."""
    return decoy.mock(cls=LoadedCoreMap)


@pytest.fixture
def mock_broker(decoy: Decoy) -> LegacyBroker:
    """Get a mock command message broker."""
    return decoy.mock(cls=LegacyBroker)


@pytest.fixture
def api_version() -> APIVersion:
    """Get an API version to apply to the interface."""
    return APIVersion(2, 23)


@pytest.fixture
def subject(
    api_version: APIVersion,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    mock_broker: LegacyBroker,
) -> FlexStackerContext:
    """Get an absorbance reader context with its dependencies mocked out."""
    return FlexStackerContext(
        core=mock_core,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
        broker=mock_broker,
        api_version=api_version,
    )


def test_get_serial_number(
    decoy: Decoy, mock_core: FlexStackerCore, subject: FlexStackerContext
) -> None:
    """It should get the serial number from the core."""
    decoy.when(mock_core.get_serial_number()).then_return("12345")
    result = subject.serial_number
    assert result == "12345"


def test_load_labware_to_hopper(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
) -> None:
    """It should create two labware to the core map."""
    labware_core = decoy.mock(cls=LabwareCore)
    decoy.when(labware_core.get_well_columns()).then_return([])
    decoy.when(
        mock_protocol_core.load_labware(
            load_name="some-load-name",
            label=None,
            namespace=None,
            version=None,
            location=mock_core,
        )
    ).then_return(labware_core)

    labware = Labware(
        core=labware_core,
        api_version=subject.api_version,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
    )

    subject.load_labware_to_hopper(load_name="some-load-name", quantity=2)

    # labware is added twice
    decoy.verify(mock_core_map.add(labware_core, labware), times=2)


def test_load_labware_with_lid_to_hopper(
    decoy: Decoy,
    mock_core: FlexStackerCore,
    mock_protocol_core: ProtocolCore,
    mock_core_map: LoadedCoreMap,
    subject: FlexStackerContext,
) -> None:
    """It should create two labware to the core map."""
    labware_core = decoy.mock(cls=LabwareCore)
    decoy.when(labware_core.get_well_columns()).then_return([])
    lid_core = decoy.mock(cls=LabwareCore)
    decoy.when(lid_core.get_well_columns()).then_return([])

    decoy.when(
        mock_protocol_core.load_labware(
            load_name="some-load-name",
            label=None,
            namespace=None,
            version=None,
            location=mock_core,
        )
    ).then_return(labware_core)

    decoy.when(
        mock_protocol_core.load_lid(
            load_name="some-lid-name",
            location=labware_core,
            namespace=None,
            version=None,
        )
    ).then_return(lid_core)

    labware = Labware(
        core=labware_core,
        api_version=subject.api_version,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
    )
    lid = Labware(
        core=lid_core,
        api_version=subject.api_version,
        protocol_core=mock_protocol_core,
        core_map=mock_core_map,
    )

    subject.load_labware_to_hopper(
        load_name="some-load-name", quantity=2, lid="some-lid-name"
    )

    # labware is added twice to the map
    decoy.verify(mock_core_map.add(labware_core, labware), times=2)
    # lid is never added to the map
    decoy.verify(mock_core_map.add(lid_core, lid), times=0)
