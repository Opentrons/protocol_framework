"""Common movement base models."""

from __future__ import annotations

from typing import Literal

from opentrons_shared_data.errors import ErrorCodes
from ..errors import ErrorOccurrence


class StackerShuttleEmptyError(ErrorOccurrence):
    """Returned when the machine detects that the stacker shuttle is empty."""

    isDefined: bool = True
    errorType: Literal["stackerShuttleEmpty"] = "stackerShuttleEmpty"

    errorCode: str = ErrorCodes.STACKER_SHUTTLE_EMPTY.value.code
    detail: str = ErrorCodes.STACKER_SHUTTLE_EMPTY.value.detail
