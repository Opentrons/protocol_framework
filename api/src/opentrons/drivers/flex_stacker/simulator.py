from typing import Optional

from opentrons.util.async_helpers import ensure_yield

from .abstract import StackerDriver
from .types import (
    StackerAxis,
    PlatformStatus,
    Direction,
    StackerInfo,
    HardwareRevision,
    MoveParams,
    LimitSwitchStatus,
)


class SimulatingDriver(StackerDriver):
    """FLEX Stacker driver simulator."""

    def __init__(self, serial_number: Optional[str] = None) -> None:
        self._sn = serial_number or "dummySerialFS"
        self._limit_switch_status = LimitSwitchStatus(False, False, False, False, False)
        self._platform_sensor_status = PlatformStatus(False, False)
        self._door_closed = True

    def set_limit_switch(self, status: LimitSwitchStatus) -> None:
        self._limit_switch_status = status

    def set_platform_sensor(self, status: PlatformStatus) -> None:
        self._platform_sensor_status = status

    def set_door_closed(self, door_closed: bool) -> None:
        self._door_closed = door_closed

    @ensure_yield
    async def connect(self) -> None:
        """Connect to stacker."""
        pass

    @ensure_yield
    async def disconnect(self) -> None:
        """Disconnect from stacker."""
        pass

    @ensure_yield
    async def is_connected(self) -> bool:
        """Check connection to stacker."""
        return True

    @ensure_yield
    async def get_device_info(self) -> StackerInfo:
        """Get Device Info."""
        return StackerInfo(fw="stacker-fw", hw=HardwareRevision.EVT, sn=self._sn)

    @ensure_yield
    async def set_serial_number(self, sn: str) -> None:
        """Set Serial Number."""
        pass

    @ensure_yield
    async def stop_motor(self) -> None:
        """Stop motor movement."""
        pass

    @ensure_yield
    async def get_limit_switch(self, axis: StackerAxis, direction: Direction) -> bool:
        """Get limit switch status.

        :return: True if limit switch is triggered, False otherwise
        """
        return self._limit_switch_status.get(axis, direction)

    @ensure_yield
    async def get_limit_switches_status(self) -> LimitSwitchStatus:
        """Get limit switch statuses for all axes."""
        return self._limit_switch_status

    @ensure_yield
    async def get_platform_sensor_status(self) -> PlatformStatus:
        """Get platform sensor status.

        :return: True if platform is detected, False otherwise
        """
        return self._platform_sensor_status

    @ensure_yield
    async def get_hopper_door_closed(self) -> bool:
        """Get whether or not door is closed.

        :return: True if door is closed, False otherwise
        """
        return self._door_closed

    @ensure_yield
    async def move_in_mm(
        self, axis: StackerAxis, distance: float, params: MoveParams | None = None
    ) -> None:
        """Move axis."""
        pass

    @ensure_yield
    async def move_to_limit_switch(
        self, axis: StackerAxis, direction: Direction, params: MoveParams | None = None
    ) -> None:
        """Move until limit switch is triggered."""
        pass
