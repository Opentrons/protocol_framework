"""Protocol engine types to do with labware."""

from __future__ import annotations

from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field

from .location import LabwareLocation
from .labware_offset_location import LegacyLabwareOffsetLocation
from .labware_offset_vector import LabwareOffsetVector
from .util import Vec3f


class OverlapOffset(Vec3f):
    """Offset representing overlap space of one labware on top of another labware or module."""


class LabwareOffset(BaseModel):
    """An offset that the robot adds to a pipette's position when it moves to a labware.

    During the run, if a labware is loaded whose definition URI and location
    both match what's found here, the given offset will be added to all
    pipette movements that use that labware as a reference point.
    """

    id: str = Field(..., description="Unique labware offset record identifier.")
    createdAt: datetime = Field(..., description="When this labware offset was added.")
    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LegacyLabwareOffsetLocation = Field(
        ...,
        description="Where the labware is located on the robot.",
    )
    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class LabwareOffsetCreate(BaseModel):
    """Create request data for a labware offset."""

    definitionUri: str = Field(..., description="The URI for the labware's definition.")
    location: LegacyLabwareOffsetLocation = Field(
        ...,
        description="Where the labware is located on the robot.",
    )
    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class LoadedLabware(BaseModel):
    """A labware that has been loaded."""

    id: str
    loadName: str
    definitionUri: str
    location: LabwareLocation = Field(
        ..., description="The labware's current location."
    )
    lid_id: Optional[str] = Field(
        None,
        description=("Labware ID of a Lid currently loaded on top of the labware."),
    )
    offsetId: Optional[str] = Field(
        None,
        description=(
            "An ID referencing the labware offset"
            " that applies to this labware placement."
            " Null or undefined means no offset was provided for this load,"
            " so the default of (0, 0, 0) will be used."
        ),
    )
    displayName: Optional[str] = Field(
        None,
        description="A user-specified display name for this labware, if provided.",
    )
