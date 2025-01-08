from typing import List, Protocol

from .types import (
    LimitSwitchStatus,
    StackerAxis,
    PlatformStatus,
    Direction,
    MoveParams,
    StackerInfo,
    LEDColor,
)


class AbstractFlexStackerDriver(Protocol):
    """Protocol for the Stacker driver."""

    async def connect(self) -> None:
        """Connect to stacker."""
        ...

    async def disconnect(self) -> None:
        """Disconnect from stacker."""
        ...

    async def is_connected(self) -> bool:
        """Check connection to stacker."""
        ...

    async def get_device_info(self) -> StackerInfo:
        """Get Device Info."""
        ...

    async def set_serial_number(self, sn: str) -> bool:
        """Set Serial Number."""
        ...

    async def enable_motors(self, axis: List[StackerAxis]) -> bool:
        """Enables the axis motor if present, disables it otherwise."""
        ...

    async def stop_motors(self) -> bool:
        """Stop all motor movement."""
        ...

    async def get_motion_params(self, axis: StackerAxis) -> MoveParams:
        """Get the motion parameters used by the given axis motor."""
        ...

    async def get_limit_switch(self, axis: StackerAxis, direction: Direction) -> bool:
        """Get limit switch status.

        :return: True if limit switch is triggered, False otherwise
        """
        ...

    async def get_limit_switches_status(self) -> LimitSwitchStatus:
        """Get limit switch statuses for all axes."""
        ...

    async def get_platform_sensor(self, direction: Direction) -> bool:
        """Get platform sensor status.

        :return: True if platform is present, False otherwise
        """
        ...

    async def get_platform_status(self) -> PlatformStatus:
        """Get platform status."""
        ...

    async def get_hopper_door_closed(self) -> bool:
        """Get whether or not door is closed.

        :return: True if door is closed, False otherwise
        """
        ...

    async def move_in_mm(
        self, axis: StackerAxis, distance: float, params: MoveParams | None = None
    ) -> bool:
        """Move axis."""
        ...

    async def move_to_limit_switch(
        self, axis: StackerAxis, direction: Direction, params: MoveParams | None = None
    ) -> bool:
        """Move until limit switch is triggered."""
        ...

    async def home_axis(self, axis: StackerAxis, direction: Direction) -> bool:
        """Home axis."""
        ...

    async def set_led(
        self, power: float, color: LEDColor | None = None, external: bool | None = None
    ) -> bool:
        """Set LED color of status bar."""
        ...

    async def enter_programming_mode(self) -> None:
        """Reboot into programming mode"""
        ...
