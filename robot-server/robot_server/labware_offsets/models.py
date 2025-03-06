"""Request/response models for the `/labwareOffsets` endpoints."""

from datetime import datetime
import enum
from typing import Literal, Annotated, Final, TypeAlias, Sequence

from pydantic import BaseModel, Field

from opentrons.protocol_engine import (
    LabwareOffsetVector,
)
from opentrons.protocol_engine.types.labware_offset_location import (
    LabwareOffsetLocationSequenceComponentsUnion,
)
from pydantic.json_schema import SkipJsonSchema

from robot_server.errors.error_responses import ErrorDetails


class _DoNotFilter(enum.Enum):
    DO_NOT_FILTER = enum.auto()


DO_NOT_FILTER: Final = _DoNotFilter.DO_NOT_FILTER
"""A sentinel value for when a filter should not be applied.

This is different from filtering on `None`, which returns only entries where the
value is equal to `None`.
"""


DoNotFilterType: TypeAlias = Literal[_DoNotFilter.DO_NOT_FILTER]
"""The type of `DO_NOT_FILTER`, as `NoneType` is to `None`.

Unfortunately, mypy doesn't let us write `Literal[DO_NOT_FILTER]`. Use this instead.
"""


class UnknownLabwareOffsetLocationSequenceComponent(BaseModel):
    """A labware offset location sequence component from the future."""

    kind: Literal["unknown"] = "unknown"
    storedKind: str
    primaryValue: str


# This is redefined here so we can add stuff to it easily
StoredLabwareOffsetLocationSequenceComponents = Annotated[
    LabwareOffsetLocationSequenceComponentsUnion, Field(discriminator="kind")
]


ReturnedLabwareOffsetLocationSequenceComponents = Annotated[
    LabwareOffsetLocationSequenceComponentsUnion
    | UnknownLabwareOffsetLocationSequenceComponent,
    Field(discriminator="kind"),
]


class StoredLabwareOffsetCreate(BaseModel):
    """Create an offset for storage."""

    definitionUri: str = Field(..., description="The URI for the labware's definition.")

    locationSequence: Sequence[StoredLabwareOffsetLocationSequenceComponents] = Field(
        ...,
        description="Where the labware is located on the robot.",
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
    locationSequence: Sequence[ReturnedLabwareOffsetLocationSequenceComponents] = Field(
        ...,
        description="Where the labware is located on the robot. Can represent all locations, but may not be present for older runs.",
        min_length=1,
    )

    vector: LabwareOffsetVector = Field(
        ...,
        description="The offset applied to matching labware.",
    )


class SearchFilter(BaseModel):
    """A filter for searching for labware offsets.

    An offset passes this filter if it passes all of these fields.
    (In other words, the fields are logically ANDed together).
    """

    id: Annotated[
        str | SkipJsonSchema[DoNotFilterType],
        Field(
            description=(
                "Filter for exact matches on the result's `id` field."
                " Omit to accept any `id`."
            )
        ),
    ] = DO_NOT_FILTER
    definitionUri: Annotated[
        str | SkipJsonSchema[DoNotFilterType],
        Field(
            description=(
                "Filter for exact matches on the result's `definitionUri` field."
                " Omit to accept any `definitionUri`."
            )
        ),
    ] = DO_NOT_FILTER
    locationSequence: Annotated[
        Sequence[StoredLabwareOffsetLocationSequenceComponents]
        | SkipJsonSchema[DoNotFilterType],
        Field(
            description=(
                "Filter for exact matches on the result's `locationSequence` field."
                " Omit to accept any `locationSequence`."
            )
        ),
    ] = DO_NOT_FILTER

    mostRecentOnly: Annotated[
        bool,
        Field(
            description=(
                "If `true`, this filter returns only the most recent matching result."
            )
        ),
    ] = False


class LabwareOffsetNotFound(ErrorDetails):
    """An error returned when a requested labware offset does not exist."""

    id: Literal["LabwareOffsetNotFound"] = "LabwareOffsetNotFound"
    title: str = "Labware Offset Not Found"

    @classmethod
    def build(cls, bad_offset_id: str) -> "LabwareOffsetNotFound":
        """Return an error with a standard message."""
        return cls.model_construct(detail=f'No offset found with ID "{bad_offset_id}".')
