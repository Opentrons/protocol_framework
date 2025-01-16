"""Tests for Flex Stacker Engine Core."""
import pytest
from decoy import Decoy

from opentrons.hardware_control import SynchronousAdapter
from opentrons.hardware_control.modules import FlexStacker
from opentrons.hardware_control.modules.types import (
    ModuleType,
)
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_api.core.engine.module_core import FlexStackerCore
from opentrons.protocol_api import MAX_SUPPORTED_VERSION

SyncFlexStackerHardware = SynchronousAdapter[FlexStacker]


@pytest.fixture
def mock_engine_client(decoy: Decoy) -> EngineClient:
    """Get a mock ProtocolEngine synchronous client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def mock_sync_module_hardware(decoy: Decoy) -> SyncFlexStackerHardware:
    """Get a mock synchronous module hardware."""
    return decoy.mock(name="SyncFlexStackerHardware")  # type: ignore[no-any-return]


@pytest.fixture
def subject(
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncFlexStackerHardware,
) -> FlexStackerCore:
    """Get a Flex Stacker Core test subject."""
    return FlexStackerCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )


def test_create(
    decoy: Decoy,
    mock_engine_client: EngineClient,
    mock_sync_module_hardware: SyncFlexStackerHardware,
) -> None:
    """It should be able to create a Flex Stacker module core."""
    result = FlexStackerCore(
        module_id="1234",
        engine_client=mock_engine_client,
        api_version=MAX_SUPPORTED_VERSION,
        sync_module_hardware=mock_sync_module_hardware,
    )

    assert result.module_id == "1234"
    assert result.MODULE_TYPE == ModuleType.FLEX_STACKER
