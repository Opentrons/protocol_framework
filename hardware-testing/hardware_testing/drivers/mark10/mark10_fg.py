"""Mark10 Force Gauge Driver."""
from serial import Serial  # type: ignore[import]
from abc import ABC, abstractmethod
from time import time
from typing import List, Optional, Protocol
import asyncio
from opentrons.drivers.asyncio.communication import AsyncResponseSerialConnection

FG_BAUDRATE = 115200
DEFAULT_FG_TIMEOUT = 1
FG_TIMEOUT = 1
FG_ACK = ""
FG_ERROR_KEYWORD = "err"
FG_ASYNC_ERROR_ACK = "async"
DEFAULT_COMMAND_RETRIES = 0

class AbstractForceGaugeDriver(Protocol):
    """Protocol for the force gauge driver."""
    async def connect(self) -> None:
        """Connect to force gauge."""
        ...

    async def disconnect(self) -> None:
        """Disconnect to force gauge."""
        ...

    @abstractmethod
    def is_simulator(self) -> bool:
        """Is this a simulation."""
        ...

    async def read_force(self, timeout: float = 1.0) -> float:
        """Read Force in Newtons."""
        ...

    # @classmethod
    # def vid_pid(cls) -> Tuple[int, int]:
    #     """Mark10 Force Gauge VID:PID."""
    #     # Check what's the VID and PID for this device
    #     return 0x0483, 0xA1AD




class Mark10(AbstractForceGaugeDriver):
    """Mark10 Driver."""

    def __init__(self, connection: Serial) -> None:
        """
        Constructor

        Args:
            connection: Connection to the FLEX Stacker
        """
        self._force_guage = connection
        self._units = None

    @classmethod
    async def create(cls, port: str, baudrate: int,loop: Optional[asyncio.AbstractEventLoop]) -> "Mark10":
        """Create a Mark10 driver."""
        conn = Serial(port=port, baudrate=baudrate, timeout=FG_TIMEOUT)
        return Mark10(connection=conn)

    async def is_simulator(self) -> bool:
        """Is simulator."""
        return False

    async def connect(self) -> None:
        """Connect."""
        await self._force_guage.open()

    async def disconnect(self) -> None:
        """Disconnect."""
        await self._force_guage.close()

    async def _write(self, data: bytes) -> None:
        """Non-blocking write operation."""
        # Offload write to another thread to avoid blocking the event loop
        await asyncio.to_thread(self._force_guage.write, data)

    async def _readline(self) -> str:
        """Non-blocking read operation."""
        # Offload readline to another thread to avoid blocking the event loop
        return await asyncio.to_thread(self._force_guage.readline)

    async def read_force(self, timeout: float = 1.0) -> float:
        """Get Force in Newtons."""
        await self._write("?\r\n".encode("utf-8"))
        start_time = time()
        while time() < start_time + timeout:
            # Read the line asynchronously
            line = await self._readline()
            line = line.decode("utf-8").strip()
            try:
                force_val, units = line.split(" ")
                if units != "N":
                    await self._write("N\r\n")  # Set force gauge units to Newtons
                    print(f'Setting gauge units from {units} to "N" (newtons)')
                    continue
                else:
                    return float(force_val)
            except ValueError as e:
                print(e)
                print(f'bad data: "{line}"')
                continue
        raise TimeoutError(f"unable to read from gauge within {timeout} seconds")

    def reset_serial_buffers(self) -> None:
        """Reset the input and output serial buffers."""
        self._force_guage._serial.reset_input_buffer()
        self._force_guage._serial.reset_output_buffer()
