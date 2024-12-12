from abc import ABC, abstractmethod
from typing import Dict

from opentrons.drivers.stacker import AXIS, DIR

class AbstractFlexStacker(ABC):
    @abstractmethod
    async def connect(self) -> None:
        ...

    @abstractmethod
    async def disconnect(self) -> None:
        ...

    @abstractmethod
    async def is_connected(self) -> bool:
        ...

    @abstractmethod
    async def get_device_info(self) -> str:
        ...

    @abstractmethod
    async def set_device_serial_number(self, serial_number: str) -> None:
        ...

    @abstractmethod
    async def enable_motor(self) -> None:
        ...

    @abstractmethod
    async def disable_motor(self) -> None:
        ...

    @abstractmethod
    async def get_sensor_states(self) -> Dict[str, str]:
        ...

    @abstractmethod
    async def get_platform_sensor_states(self) -> Dict[str, str]:
        ...

    @abstractmethod
    async def get_settings(self) -> str:
        ...

    @abstractmethod
    async def get_current_motion_params(self, axis: Axis) -> None:
        ...

    @abstractmethod
    async def move(
        self, axis: Axis, distance: float, direction: DIR,
        velocity: Optional[float] = None, acceleration: Optional[float] = None,
        msd: Optional[float] = None, current: Optional[float] = None) -> None:
        ...

    @abstractmethod
    async def microstepping(self, axis: Axis, distance: float, direction: DIR) -> None:
        ...

    @abstractmethod
    async def home(self, axis: Axis, direction: DIR, velocity: Optional[float] = None,
                                                                acceleration: Optional[float] = None,
                                                                current: Optional[float] = None) -> None:
        ...

    async def microstepping(self, axis: Axis, distance: float, direction: DIR) -> None:
        ...

    @abstractmethod
    async def set_ihold_current(self, current: float, axis: AXIS) -> str:
        ...

    @abstractmethod
    async def set_run_current(self, current: float, axis: AXIS) -> str:
        ...

    @abstractmethod
    async def close_latch(self, velocity: Optional[float] = None, acceleration: Optional[float] = None):
        ...

    @abstractmethod
    async def open_latch(self, velocity: Optional[float] = None, acceleration: Optional[float] = None,
                                                            max_speed_discontinuity: Optional[float = None]) -> str:
        ...

    @abstractmethod
    async def load_labware(self, labware_height: float) -> None:
        ...

    @abstractmethod
    async def unload_labware(self, labware_height: float) -> None:
        ...

    @abstractmethod
    async def enable_SG(self, axis: AXIS, sg_value: int, enable: bool) -> None:
        ...

    @abstractmethod
    async def read_SG_value(self, axis: AXIS) -> int:
        ...

    # @abstractmethod
    # async def enter_programming_mode(self) -> None:
    #     ...
