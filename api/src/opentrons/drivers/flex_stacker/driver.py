import asyncio
import re
from typing import Optional

from opentrons.drivers.command_builder import CommandBuilder
from opentrons.drivers.asyncio.communication import AsyncResponseSerialConnection

from .abstract import StackerDriver
from .types import (
    GCODE,
    StackerAxis,
    PlatformStatus,
    Direction,
    StackerInfo,
    HardwareRevision,
    MoveParams,
    LimitSwitchStatus,
)


FS_BAUDRATE = 115200
DEFAULT_FS_TIMEOUT = 40
FS_ACK = "OK\n"
FS_ERROR_KEYWORD = "err"
FS_ASYNC_ERROR_ACK = "async"
DEFAULT_COMMAND_RETRIES = 0
GCODE_ROUNDING_PRECISION = 2


class FlexStackerDriver(StackerDriver):
    """FLEX Stacker driver."""

    @classmethod
    def parse_device_info(cls, response: str) -> StackerInfo:
        """Parse stacker info."""
        _RE = re.compile(
            f"^{GCODE.DEVICE_INFO} FW:(?P<fw>.+) HW:Opentrons-flex-stacker-(?P<hw>.+) SerialNo:(?P<sn>.+)"
        )
        m = _RE.match(response)
        if not m:
            raise ValueError(f"Incorrect Response for device info: {response}")
        return StackerInfo(
            m.group("fw"), HardwareRevision(m.group("hw")), m.group("sn")
        )

    @classmethod
    def parse_limit_switch_status(cls, response: str) -> LimitSwitchStatus:
        """Parse limit switch statuses."""
        field_names = LimitSwitchStatus.get_fields()
        pattern = r"\s".join([rf"{name}:(?P<{name}>\d)" for name in field_names])
        _RE = re.compile(f"^{GCODE.GET_LIMIT_SWITCH} {pattern}")
        m = _RE.match(response)
        if not m:
            raise ValueError(f"Incorrect Response for limit switch status: {response}")
        return LimitSwitchStatus(*(bool(int(m.group(name))) for name in field_names))

    @classmethod
    def parse_platform_sensor_status(cls, response: str) -> PlatformStatus:
        """Parse platform statuses."""
        field_names = PlatformStatus.get_fields()
        pattern = r"\s".join([rf"{name}:(?P<{name}>\d)" for name in field_names])
        _RE = re.compile(f"^{GCODE.GET_PLATFORM_SENSOR} {pattern}")
        m = _RE.match(response)
        if not m:
            raise ValueError(f"Incorrect Response for platform status: {response}")
        return PlatformStatus(*(bool(int(m.group(name))) for name in field_names))

    @classmethod
    def parse_door_closed(cls, response: str) -> bool:
        """Parse door closed."""
        _RE = re.compile(r"^M122 (\d)")
        match = _RE.match(response)
        if not match:
            raise ValueError(f"Incorrect Response for door closed: {response}")
        return bool(int(match.group(1)))

    @classmethod
    def append_move_params(
        cls, command: CommandBuilder, params: MoveParams | None
    ) -> CommandBuilder:
        """Append move params."""
        if params is not None:
            if params.max_speed is not None:
                command.add_float("V", params.max_speed, GCODE_ROUNDING_PRECISION)
            if params.acceleration is not None:
                command.add_float("A", params.acceleration, GCODE_ROUNDING_PRECISION)
            if params.max_speed_discont is not None:
                command.add_float(
                    "D", params.max_speed_discont, GCODE_ROUNDING_PRECISION
                )
        return command

    @classmethod
    async def create(
        cls, port: str, loop: Optional[asyncio.AbstractEventLoop]
    ) -> "FlexStackerDriver":
        """Create a FLEX Stacker driver."""
        connection = await AsyncResponseSerialConnection.create(
            port=port,
            baud_rate=FS_BAUDRATE,
            timeout=DEFAULT_FS_TIMEOUT,
            number_of_retries=DEFAULT_COMMAND_RETRIES,
            ack=FS_ACK,
            loop=loop,
            error_keyword=FS_ERROR_KEYWORD,
            async_error_ack=FS_ASYNC_ERROR_ACK,
        )
        return cls(connection)

    def __init__(self, connection: AsyncResponseSerialConnection) -> None:
        """
        Constructor

        Args:
            connection: Connection to the FLEX Stacker
        """
        self._connection = connection

    async def connect(self) -> None:
        """Connect to stacker."""
        await self._connection.open()

    async def disconnect(self) -> None:
        """Disconnect from stacker."""
        await self._connection.close()

    async def is_connected(self) -> bool:
        """Check connection to stacker."""
        return await self._connection.is_open()

    async def get_device_info(self) -> StackerInfo:
        """Get Device Info."""
        response = await self._connection.send_command(
            GCODE.DEVICE_INFO.build_command()
        )
        return self.parse_device_info(response)

    async def set_serial_number(self, sn: str) -> None:
        """Set Serial Number."""
        await self._connection.send_command(
            GCODE.SET_SERIAL_NUMBER.build_command().add_element(sn)
        )

    async def stop_motor(self) -> None:
        """Stop motor movement."""
        await self._connection.send_command(GCODE.STOP_MOTOR.build_command())

    async def get_limit_switch(self, axis: StackerAxis, direction: Direction) -> bool:
        """Get limit switch status.

        :return: True if limit switch is triggered, False otherwise
        """
        response = await self.get_limit_switches_status()
        return response.get(axis, direction)

    async def get_limit_switches_status(self) -> LimitSwitchStatus:
        """Get limit switch statuses for all axes."""
        response = await self._connection.send_command(
            GCODE.GET_LIMIT_SWITCH.build_command()
        )
        return self.parse_limit_switch_status(response)

    async def get_platform_sensor_status(self) -> PlatformStatus:
        """Get platform sensor status.

        :return: True if platform is detected, False otherwise
        """
        response = await self._connection.send_command(
            GCODE.GET_PLATFORM_SENSOR.build_command()
        )
        return self.parse_platform_sensor_status(response)

    async def get_hopper_door_closed(self) -> bool:
        """Get whether or not door is closed.

        :return: True if door is closed, False otherwise
        """
        response = await self._connection.send_command(
            GCODE.GET_DOOR_SWITCH.build_command()
        )
        return self.parse_door_closed(response)

    async def move_in_mm(
        self, axis: StackerAxis, distance: float, params: MoveParams | None = None
    ) -> None:
        """Move axis."""
        command = self.append_move_params(
            GCODE.MOVE_TO.build_command().add_float(
                axis.name, distance, GCODE_ROUNDING_PRECISION
            ),
            params,
        )
        await self._connection.send_command(command)

    async def move_to_limit_switch(
        self, axis: StackerAxis, direction: Direction, params: MoveParams | None = None
    ) -> None:
        """Move until limit switch is triggered."""
        command = self.append_move_params(
            GCODE.MOVE_TO_SWITCH.build_command().add_int(axis.name, direction.value),
            params,
        )
        await self._connection.send_command(command)
