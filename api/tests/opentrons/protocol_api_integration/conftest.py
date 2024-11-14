"""Fixtures for protocol api integration tests."""

import pytest
from _pytest.fixtures import SubRequest
from typing import Generator

from opentrons import simulate, protocol_api


@pytest.fixture
def simulated_protocol_context(
    request: SubRequest,
) -> Generator[protocol_api.ProtocolContext, None, None]:
    """Return a protocol context with requested version and robot."""
    version, robot_type = request.param
    context = simulate.get_protocol_api(version=version, robot_type=robot_type)
    try:
        yield context
    finally:
        simulate._LIVE_PROTOCOL_ENGINE_CONTEXTS.close()
