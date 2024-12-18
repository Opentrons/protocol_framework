import pytest
from mock import AsyncMock
from opentrons.drivers.asyncio.communication.serial_connection import (
    AsyncResponseSerialConnection,
)
from opentrons.drivers.flex_stacker.driver import FlexStackerDriver
from opentrons.drivers.flex_stacker import types
from opentrons.drivers.command_builder import CommandBuilder


@pytest.fixture
def connection() -> AsyncMock:
    return AsyncMock(spec=AsyncResponseSerialConnection)


@pytest.fixture
def subject(connection: AsyncMock) -> FlexStackerDriver:
    connection.send_command.return_value = ""
    return FlexStackerDriver(connection)


async def test_get_device_info(
    subject: FlexStackerDriver, connection: AsyncMock
) -> None:
    """It should send a get device info command"""
    connection.send_command.return_value = (
        "M115 FW:dummy-fw-version HW:Opentrons-flex-stacker-a1 SerialNo:dummy-serial ok\n"
    )
    response = await subject.get_device_info()
    assert response == types.StackerInfo(
        fw="dummy-fw-version",
        hw=types.HardwareRevision.EVT,
        sn="dummy-serial",
    )
    
    device_info = types.GCODE.DEVICE_INFO.build_command()
    reset_reason = types.GCODE.GET_RESET_REASON.build_command()
    connection.send_command.assert_any_call(command=device_info)
    connection.send_command.assert_called_with(command=reset_reason)


