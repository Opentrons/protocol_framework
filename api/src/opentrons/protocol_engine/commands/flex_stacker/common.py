from typing import Literal

from opentrons.protocol_engine import ErrorOccurrence
from opentrons_shared_data.errors import ErrorCodes


class FlexStackerStallOrCollisionError(ErrorOccurrence):
    """Returned when the motor driver detects a stall."""

    isDefined: bool = True
    errorType: Literal["flexStackerStallOrCollision"] = "flexStackerStallOrCollision"

    errorCode: str = ErrorCodes.STALL_OR_COLLISION_DETECTED.value.code
    detail: str = ErrorCodes.STALL_OR_COLLISION_DETECTED.value.detail
