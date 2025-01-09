from __future__ import annotations

import asyncio
import logging
from typing import Dict, Optional, Mapping

from opentrons.drivers.flex_stacker.types import (
    Direction,
    MoveParams,
    MoveResult,
    StackerAxis,
)
from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.flex_stacker.driver import (
    STACKER_MOTION_CONFIG,
    FlexStackerDriver,
)
from opentrons.drivers.flex_stacker.abstract import AbstractFlexStackerDriver
from opentrons.drivers.flex_stacker.simulator import SimulatingDriver
from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.poller import Reader, Poller
from opentrons.hardware_control.modules import mod_abc, update
from opentrons.hardware_control.modules.types import (
    FlexStackerStatus,
    HopperDoorState,
    LatchState,
    ModuleDisconnectedCallback,
    ModuleType,
    PlatformState,
    StackerAxisState,
    UploadFunction,
    LiveData,
    FlexStackerData,
)

log = logging.getLogger(__name__)

POLL_PERIOD = 1.0
SIMULATING_POLL_PERIOD = POLL_PERIOD / 20.0

DFU_PID = "df11"

# Distance in mm the latch can travel to open/close
LATCH_TRAVEL = 25.0


class FlexStacker(mod_abc.AbstractModule):
    """Hardware control interface for an attached Flex-Stacker module."""

    MODULE_TYPE = ModuleType.FLEX_STACKER

    @classmethod
    async def build(
        cls,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        hw_control_loop: asyncio.AbstractEventLoop,
        poll_interval_seconds: Optional[float] = None,
        simulating: bool = False,
        sim_model: Optional[str] = None,
        sim_serial_number: Optional[str] = None,
        disconnected_callback: ModuleDisconnectedCallback = None,
    ) -> "FlexStacker":
        """
        Build a FlexStacker

        Args:
            port: The port to connect to
            usb_port: USB Port
            execution_manager: Execution manager.
            hw_control_loop: The event loop running in the hardware control thread.
            poll_interval_seconds: Poll interval override.
            simulating: whether to build a simulating driver
            loop: Loop
            sim_model: The model name used by simulator
            disconnected_callback: Callback to inform the module controller that the device was disconnected

        Returns:
            FlexStacker instance
        """
        driver: AbstractFlexStackerDriver
        if not simulating:
            driver = await FlexStackerDriver.create(port=port, loop=hw_control_loop)
            poll_interval_seconds = poll_interval_seconds or POLL_PERIOD
        else:
            driver = SimulatingDriver(serial_number=sim_serial_number)
            poll_interval_seconds = poll_interval_seconds or SIMULATING_POLL_PERIOD

        reader = FlexStackerReader(driver=driver)
        poller = Poller(reader=reader, interval=poll_interval_seconds)
        module = cls(
            port=port,
            usb_port=usb_port,
            driver=driver,
            reader=reader,
            poller=poller,
            device_info=(await driver.get_device_info()).to_dict(),
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
        )

        try:
            await poller.start()
        except Exception:
            log.exception(f"First read of Flex-Stacker on port {port} failed")

        return module

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        execution_manager: ExecutionManager,
        driver: AbstractFlexStackerDriver,
        reader: FlexStackerReader,
        poller: Poller,
        device_info: Mapping[str, str],
        hw_control_loop: asyncio.AbstractEventLoop,
        disconnected_callback: ModuleDisconnectedCallback = None,
    ):
        super().__init__(
            port=port,
            usb_port=usb_port,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
        )
        self._device_info = device_info
        self._driver = driver
        self._reader = reader
        self._poller = poller
        self._stacker_status = FlexStackerStatus.IDLE

    async def cleanup(self) -> None:
        """Stop the poller task"""
        await self._poller.stop()
        await self._driver.disconnect()

    @classmethod
    def name(cls) -> str:
        """Used for picking up serial port symlinks"""
        return "flexstacker"

    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        return "flex-stacker"

    @staticmethod
    def _model_from_revision(revision: Optional[str]) -> str:
        """Defines the revision -> model mapping"""
        return "flexStackerModuleV1"

    def model(self) -> str:
        return self._model_from_revision(self._device_info.get("model"))

    @property
    def latch_state(self) -> LatchState:
        """The state of the latch."""
        return LatchState.from_state(self.limit_switch_status[StackerAxis.L])

    @property
    def platform_state(self) -> PlatformState:
        """The state of the platform."""
        return self._reader.platform_state

    @property
    def hopper_door_state(self) -> HopperDoorState:
        """The status of the hopper door."""
        return HopperDoorState.from_state(self._reader.hopper_door_closed)

    @property
    def limit_switch_status(self) -> Dict[StackerAxis, StackerAxisState]:
        """The status of the Limit switches."""
        return self._reader.limit_switch_status

    @property
    def device_info(self) -> Mapping[str, str]:
        return self._device_info

    @property
    def status(self) -> FlexStackerStatus:
        """Module status or error state details."""
        return self._stacker_status

    @property
    def is_simulated(self) -> bool:
        return isinstance(self._driver, SimulatingDriver)

    @property
    def live_data(self) -> LiveData:
        data: FlexStackerData = {
            "latchState": self.latch_state.value,
            "platformState": self.platform_state.value,
            "hopperDoorState": self.hopper_door_state.value,
            "axisStateX": self.limit_switch_status[StackerAxis.X].value,
            "axisStateZ": self.limit_switch_status[StackerAxis.Z].value,
            "errorDetails": self._reader.error,
        }
        return {"status": self.status.value, "data": data}

    async def prep_for_update(self) -> str:
        await self._poller.stop()
        await self._driver.stop_motors()
        await self._driver.enter_programming_mode()
        # flex stacker has three unique "devices" over DFU
        dfu_info = await update.find_dfu_device(pid=DFU_PID, expected_device_count=3)
        return dfu_info

    def bootloader(self) -> UploadFunction:
        return update.upload_via_dfu

    async def deactivate(self, must_be_running: bool = True) -> None:
        await self._driver.stop_motors()

    async def move_axis(
        self,
        axis: StackerAxis,
        direction: Direction,
        distance: float,
        speed: Optional[float] = None,
        acceleration: Optional[float] = None,
        current: Optional[float] = None,
    ) -> bool:
        """Move the axis in a direction by the given distance in mm."""
        motion_params = STACKER_MOTION_CONFIG[axis]["move"]
        await self._driver.set_run_current(axis, current or motion_params.current or 0)
        if any([speed, acceleration]):
            motion_params.max_speed = speed or motion_params.max_speed
            motion_params.acceleration = acceleration or motion_params.acceleration
        distance = direction.distance(distance)
        success = await self._driver.move_in_mm(axis, distance, params=motion_params)
        # TODO: This can return a stall, handle that here
        return success == MoveResult.NO_ERROR

    async def home_axis(
        self,
        axis: StackerAxis,
        direction: Direction,
        speed: Optional[float] = None,
        acceleration: Optional[float] = None,
        current: Optional[float] = None,
    ) -> bool:
        motion_params = STACKER_MOTION_CONFIG[axis]["home"]
        await self._driver.set_run_current(axis, current or motion_params.current or 0)
        # Set the max hold current for the Z axis
        if axis == StackerAxis.Z:
            await self._driver.set_ihold_current(axis, 1.8)
        if any([speed, acceleration]):
            motion_params.max_speed = speed or motion_params.max_speed
            motion_params.acceleration = acceleration or motion_params.acceleration
        success = await self._driver.move_to_limit_switch(
            axis=axis, direction=direction, params=motion_params
        )
        # TODO: This can return a stall, handle that here
        return success == MoveResult.NO_ERROR

    async def close_latch(
        self,
        velocity: Optional[float] = None,
        acceleration: Optional[float] = None,
    ) -> bool:
        """Close the latch, dropping any labware its holding."""
        # Dont move the latch if its already closed.
        if self.limit_switch_status[StackerAxis.L] == StackerAxisState.EXTENDED:
            return True
        motion_params = STACKER_MOTION_CONFIG[StackerAxis.L]["move"]
        speed = velocity or motion_params.max_speed
        accel = acceleration or motion_params.acceleration
        success = await self.move_axis(
            StackerAxis.L,
            Direction.RETRACT,
            distance=LATCH_TRAVEL,
            speed=speed,
            acceleration=accel,
        )
        # Check that the latch is closed.
        await self._reader.get_limit_switch_status()
        return (
            success
            and self.limit_switch_status[StackerAxis.L] == StackerAxisState.EXTENDED
        )

    async def open_latch(
        self,
        velocity: Optional[float] = None,
        acceleration: Optional[float] = None,
    ) -> bool:
        """Open the latch."""
        # Dont move the latch if its already opened.
        if self.limit_switch_status[StackerAxis.L] == StackerAxisState.RETRACTED:
            return True
        motion_params = STACKER_MOTION_CONFIG[StackerAxis.L]["move"]
        speed = velocity or motion_params.max_speed
        accel = acceleration or motion_params.acceleration
        success = await self.move_axis(
            StackerAxis.L,
            Direction.EXTENT,
            distance=LATCH_TRAVEL,
            speed=speed,
            acceleration=accel,
        )
        # Check that the latch is opened.
        await self._reader.get_limit_switch_status()
        return (
            success
            and self.limit_switch_status[StackerAxis.L] == StackerAxisState.RETRACTED
        )

    # NOTE: We are defining the interface, will implement in seperate pr.
    async def dispense(self) -> bool:
        """Dispenses the next labware in the stacker."""
        return True

    async def store(self) -> bool:
        """Stores a labware in the stacker."""
        return True


class FlexStackerReader(Reader):
    error: Optional[str]

    def __init__(self, driver: AbstractFlexStackerDriver) -> None:
        self.error: Optional[str] = None
        self._driver = driver
        self.limit_switch_status = {
            axis: StackerAxisState.UNKNOWN for axis in StackerAxis
        }
        self.platform_state = PlatformState.UNKNOWN
        self.hopper_door_closed = False
        self.motion_params = {axis: MoveParams(axis=axis) for axis in StackerAxis}
        self.get_config = True

    async def read(self) -> None:
        await self.get_limit_switch_status()
        await self.get_platform_sensor_state()
        await self.get_door_closed()
        if self.get_config:
            await self.get_motion_parameters()
            self.get_config = False
        self._set_error(None)

    async def get_limit_switch_status(self) -> None:
        """Get the limit switch status."""
        status = await self._driver.get_limit_switches_status()
        self.limit_switch_status = {
            StackerAxis.X: StackerAxisState.from_status(status, StackerAxis.X),
            StackerAxis.Z: StackerAxisState.from_status(status, StackerAxis.Z),
            StackerAxis.L: StackerAxisState.from_status(status, StackerAxis.L),
        }

    async def get_motion_parameters(self) -> None:
        """Get the motion parameters used by the axis motors."""
        self.move_params = {
            axis: self._driver.get_motion_params(axis) for axis in StackerAxis
        }

    async def get_platform_sensor_state(self) -> None:
        """Get the platform state."""
        status = await self._driver.get_platform_status()
        self.platform_state = PlatformState.from_status(status)

    async def get_door_closed(self) -> None:
        """Check if the hopper door is closed."""
        self.hopper_door_closed = await self._driver.get_hopper_door_closed()

    def on_error(self, exception: Exception) -> None:
        self._set_error(exception)

    def _set_error(self, exception: Optional[Exception]) -> None:
        if exception is None:
            self.error = None
        else:
            try:
                self.error = str(exception.args[0])
            except Exception:
                self.error = repr(exception)
