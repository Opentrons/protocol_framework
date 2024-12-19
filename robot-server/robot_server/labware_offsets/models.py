"""Request/response models for the `/labwareOffsets` endpoints."""


from typing import Literal, Type
from typing_extensions import Self

from robot_server.errors.error_responses import ErrorDetails


class LabwareOffsetNotFound(ErrorDetails):
    """An error returned when a requested labware offset does not exist."""

    id: Literal["LabwareOffsetNotFound"] = "LabwareOffsetNotFound"
    title: str = "Labware Offset Not Found"

    @classmethod
    def build(cls: Type[Self], bad_offset_id: str) -> Self:
        """Return an error with a standard message."""
        return cls.construct(detail=f'No offset found with ID "{bad_offset_id}".')
