"""Request/response models for the `/labwareOffsets` endpoints."""

from datetime import datetime
from typing import Literal, Annotated

from pydantic import BaseModel, Field

from opentrons.protocol_engine import (
    LabwareOffsetVector,
)
from opentrons.protocol_engine.types.labware_offset_location import (
    LabwareOffsetLocationSequenceComponentsUnion,
)

from robot_server.errors.error_responses import ErrorDetails

# This is redefined here so we can add stuff to it easily
StoredLabwareOffsetLocationSequenceComponents = Annotated[
    LabwareOffsetLocationSequenceComponentsUnion, Field(discriminator="kind")
]


class StoredLabwareOffsetCreate(BaseModel):
    """Create an offset for storage."""

    definitionUri: str = Field(..., description="The URI for the labware's definition.")

    locationSequence: list[StoredLabwareOffsetLocationSequenceComponents] = Field(
        ...,
        description="Where the labware is located on the robot. Can represent all locations, but may not be present for older runs.",
        min_length=1,
    )
    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class StoredLabwareOffset(BaseModel):
    """An offset that the robot adds to a pipette's position when it moves to labware."""

    # This is a separate thing from the model defined in protocol engine because as a new API it does
    # not have to handle legacy locations. There is probably a better way to do this than to copy the model
    # contents, but I'm not sure what it is.
    id: str = Field(..., description="Unique labware offset record identifier.")
    createdAt: datetime = Field(..., description="When this labware offset was added.")
    definitionUri: str = Field(..., description="The URI for the labware's definition.")

    locationSequence: list[StoredLabwareOffsetLocationSequenceComponents] = Field(
        ...,
        description="Where the labware is located on the robot. Can represent all locations, but may not be present for older runs.",
        min_length=1,
    )
    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class LabwareOffsetNotFound(ErrorDetails):
    """An error returned when a requested labware offset does not exist."""

    id: Literal["LabwareOffsetNotFound"] = "LabwareOffsetNotFound"
    title: str = "Labware Offset Not Found"

    @classmethod
    def build(cls, bad_offset_id: str) -> "LabwareOffsetNotFound":
        """Return an error with a standard message."""
        return cls.model_construct(detail=f'No offset found with ID "{bad_offset_id}".')
