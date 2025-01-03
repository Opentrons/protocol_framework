import asyncio
import logging
from typing import Any, Callable, Dict, Optional, Mapping, List, Tuple

from opentrons.drivers.rpi_drivers.types import USBPort
from opentrons.drivers.flex_stacker import (
    AbstractStackerDriver,
    FlexStackerDriver,
    SimulatingDriver,
    FlexStackerTypes,
)

from opentrons.hardware_control.execution_manager import ExecutionManager
from opentrons.hardware_control.poller import Poller, Reader
from opentrons.hardware_control.modules import mod_abc, update
from opentrons.hardware_control.modules.types import (
    ModuleDisconnectedCallback,
    ModuleType,
    StackerStatus,
    LiveData,
    UploadFunction,
)

log = logging.getLogger(__name__)


POLLING_FREQUENCY_SEC = 2.0
SIM_POLLING_FREQUENCY_SEC = POLLING_FREQUENCY_SEC / 50.0


class StackerReader(Reader):
    """Read data from the FLEX Stacker.

    Args:
        driver: A connected FLEX Stacker driver.
    """

    def __init__(self, driver: AbstractStackerDriver) -> None:
        self._driver = driver
        self._handle_error: Optional[Callable[[Exception], None]] = None

    def on_error(self, exception: Exception) -> None:
        if self._handle_error is not None:
            self._handle_error(exception)
    
    async def read(self) -> None:
        """Read data from the FLEX Stacker."""
        pass


class StackerController(mod_abc.AbstractModule):
    """Hardware control interface for an attached FLEX Stacker module."""

    MODULE_TYPE = ModuleType.STACKER

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
    ) -> "StackerController":
        """
        Build and connect to a FLEX Stacker controller.

        Args:
            port: The port to connect to
            usb_port: USB Port
            execution_manager: Execution manager.
            hw_control_loop: The event loop running in the hardware control thread.
            poll_interval_seconds: Poll interval override.
            simulating: whether to build a simulating driver
            sim_model: The model name used by simulator
            sim_serial_number: The serial number used by simulator
            disconnected_callback: Callback to inform the module controller that the device was disconnected

        Returns:
            AbsorbanceReader instance.

        """
        driver: AbstractStackerDriver
        if not simulating:
            driver = await FlexStackerDriver.create(
                port, hw_control_loop
            )
            await driver.connect()
            poll_interval_seconds = poll_interval_seconds or POLLING_FREQUENCY_SEC
        else:
            driver = SimulatingDriver(serial_number=sim_serial_number)
            poll_interval_seconds = poll_interval_seconds or SIM_POLLING_FREQUENCY_SEC

        reader = StackerReader(driver=driver)
        poller = Poller(reader=reader, interval=poll_interval_seconds)
        module = cls(
            port=port,
            usb_port=usb_port,
            driver=driver,
            reader=reader,
            poller=poller,
            device_info=await driver.get_device_info(),
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
        )

        try:
            await poller.start()
        except Exception:
            log.exception(f"First read of AbsorbanceReader on port {port} failed")

        return module

    def __init__(
        self,
        port: str,
        usb_port: USBPort,
        driver: AbstractStackerDriver,
        reader: StackerReader,
        poller: Poller,
        device_info: FlexStackerTypes.StackerInfo,
        execution_manager: ExecutionManager,
        hw_control_loop: asyncio.AbstractEventLoop,
        disconnected_callback: ModuleDisconnectedCallback = None,
    ) -> None:
        """
        Constructor

        Args:
            port: The port the stacker is connected to.
            usb_port: The USB port.
            execution_manager: The hardware execution manager.
            driver: The Stacker driver.
            reader: An interface to read data from the Stacker.
            poller: A poll controller for reads.
            device_info: The Stacker device info.
            hw_control_loop: The event loop running in the hardware control thread.
        """
        self._driver = driver
        super().__init__(
            port=port,
            usb_port=usb_port,
            hw_control_loop=hw_control_loop,
            execution_manager=execution_manager,
            disconnected_callback=disconnected_callback,
        )
        self._device_info = device_info
        self._reader = reader
        self._poller = poller
        self._error: Optional[str] = None

    @property
    def status(self) -> StackerStatus:
        """Return some string describing the device status."""
        # TODO: Implement getting device status from the stacker
        return StackerStatus.IDLE

    @property
    def device_info(self) -> Mapping[str, str]:
        """Return a dict of the module's static information (serial, etc)"""
        return self._device_info.asdict()

    @property
    def live_data(self) -> LiveData:
        """Return a dict of the module's dynamic information"""
        return {
            "status": self.status.value,
            "data": {
                "deviceStatus": self.status.value,
            },
        }

    @property
    def is_simulated(self) -> bool:
        """True if this is a simulated module."""
        return isinstance(self._driver, SimulatingDriver)

    @property
    def port(self) -> str:
        """The virtual port where the module is connected."""
        return self._port

    @property
    def usb_port(self) -> USBPort:
        """The physical port where the module is connected."""
        return self._usb_port

    async def deactivate(self, must_be_running: bool = True) -> None:
        """Deactivate the module."""
        pass

    async def wait_for_is_running(self) -> None:
        if not self.is_simulated:
            await self._execution_manager.wait_for_is_running()

    async def prep_for_update(self) -> str:
        await self._poller.stop()
        await self._driver.enter_programming_mode()
        dfu_info = await update.find_dfu_device(pid=DFU_PID, expected_device_count=2)
        return dfu_info

    @classmethod
    def name(cls) -> str:
        """A shortname used for matching usb ports, among other things"""
        return "flexstacker"

    def model(self) -> str:
        """A name for this specific module, matching module defs"""
        return "flexStackerV1"

    def firmware_prefix(self) -> str:
        """The prefix used for looking up firmware"""
        return "flex-stacker"

    def bootloader(self) -> UploadFunction:
        return update.upload_via_dfu
