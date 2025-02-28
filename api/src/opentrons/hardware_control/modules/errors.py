from typing import Optional, Dict, Sequence

from opentrons.drivers.flex_stacker.types import StackerAxis
from opentrons_shared_data.errors import (
    EnumeratedError,
    RoboticsControlError,
    ErrorCodes,
)


class UpdateError(RuntimeError):
    pass


class AbsorbanceReaderDisconnectedError(RuntimeError):
    def __init__(self, serial: str):
        self.serial = serial


class FlexStackerStallError(RoboticsControlError):
    def __init__(
        self,
        serial: str,
        axis: StackerAxis,
        message: Optional[str] = None,
        detail: Optional[Dict[str, str]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a FlexStallOrCollisionDetectedError."""
        self.serial = serial
        self.axis = axis
        super().__init__(
            ErrorCodes.FLEX_STACKER_STALL_OR_COLLISION_DETECTED, message, detail, wrapping
        )
