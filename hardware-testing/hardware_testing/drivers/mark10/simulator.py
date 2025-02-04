from typing import List, Optional, Dict

from opentrons.util.async_helpers import ensure_yield

from .mark10_fg import AbstractForceGaugeDriver

class SimulatingDriver(AbstractForceGaugeDriver):
    """Simulating Mark 10 Driver."""

    def __init__(self) -> None:
        """Simulating Mark 10 Driver."""
        self._sim_force = 0.0
        super().__init__()

    def is_simulator(self) -> bool:
        """Is a simulator."""
        return True

    @ensure_yield
    async def connect(self) -> None:
        """Connect."""
        self._connected = True

    @ensure_yield
    async def disconnect(self) -> None:
        """Disconnect."""
        self._connected = False

    async def read_force(self, timeout: float = 1.0) -> float:
        """Read Force."""
        return self._sim_force

    async def set_simulation_force(self, force: float) -> int:
        """Set simulation force."""
        self._sim_force = force
