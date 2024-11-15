"""Common movement base models."""

from __future__ import annotations

from typing import Optional, Union, TYPE_CHECKING, Literal

from pydantic import BaseModel, Field

from opentrons_shared_data.errors import ErrorCodes
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError
from ..errors import ErrorOccurrence
from ..types import WellLocation, LiquidHandlingWellLocation, DeckPoint, CurrentWell
from ..state.update_types import StateUpdate
from .command import SuccessData, DefinedErrorData


if TYPE_CHECKING:
    from ..execution.movement import MovementHandler
    from ..resources.model_utils import ModelUtils


class WellLocationMixin(BaseModel):
    """Mixin for command requests that take a location that's somewhere in a well."""

    labwareId: str = Field(
        ...,
        description="Identifier of labware to use.",
    )
    wellName: str = Field(
        ...,
        description="Name of well to use in labware.",
    )
    wellLocation: WellLocation = Field(
        default_factory=WellLocation,
        description="Relative well location at which to perform the operation",
    )


class LiquidHandlingWellLocationMixin(BaseModel):
    """Mixin for command requests that take a location that's somewhere in a well."""

    labwareId: str = Field(
        ...,
        description="Identifier of labware to use.",
    )
    wellName: str = Field(
        ...,
        description="Name of well to use in labware.",
    )
    wellLocation: LiquidHandlingWellLocation = Field(
        default_factory=LiquidHandlingWellLocation,
        description="Relative well location at which to perform the operation",
    )


class MovementMixin(BaseModel):
    """Mixin for command requests that move a pipette."""

    minimumZHeight: Optional[float] = Field(
        None,
        description=(
            "Optional minimal Z margin in mm."
            " If this is larger than the API's default safe Z margin,"
            " it will make the arc higher. If it's smaller, it will have no effect."
        ),
    )

    forceDirect: bool = Field(
        False,
        description=(
            "If true, moving from one labware/well to another"
            " will not arc to the default safe z,"
            " but instead will move directly to the specified location."
            " This will also force the `minimumZHeight` param to be ignored."
            " A 'direct' movement is in X/Y/Z simultaneously."
        ),
    )

    speed: Optional[float] = Field(
        None,
        description=(
            "Override the travel speed in mm/s."
            " This controls the straight linear speed of motion."
        ),
    )


class StallOrCollisionError(ErrorOccurrence):
    """Returned when the machine detects that axis encoders are reading a different position than expected.

    All axes are stopped at the point where the error was encountered.

    The next thing to move the machine must account for the robot not having a valid estimate
    of its position. It should be a `home` or `unsafe/updatePositionEstimators`.
    """

    isDefined: bool = True
    errorType: Literal["stallOrCollision"] = "stallOrCollision"

    errorCode: str = ErrorCodes.STALL_OR_COLLISION_DETECTED.value.code
    detail: str = ErrorCodes.STALL_OR_COLLISION_DETECTED.value.detail


class DestinationPositionResult(BaseModel):
    """Mixin for command results that move a pipette."""

    # todo(mm, 2024-08-02): Consider deprecating or redefining this.
    #
    # This is here because opentrons.protocol_engine needed it for internal bookkeeping
    # and, at the time, we didn't have a way to do that without adding this to the
    # public command results. Its usefulness to callers outside
    # opentrons.protocol_engine is questionable because they would need to know which
    # critical point is in play, and I think that can change depending on obscure
    # things like labware quirks.
    position: DeckPoint = Field(
        DeckPoint(x=0, y=0, z=0),
        description=(
            "The (x,y,z) coordinates of the pipette's critical point in deck space"
            " after the move was completed."
        ),
    )


MoveToWellOperationReturn = (
    SuccessData[DestinationPositionResult] | DefinedErrorData[StallOrCollisionError]
)


async def move_to_well(
    movement: MovementHandler,
    model_utils: ModelUtils,
    pipette_id: str,
    labware_id: str,
    well_name: str,
    well_location: Optional[Union[WellLocation, LiquidHandlingWellLocation]] = None,
    current_well: Optional[CurrentWell] = None,
    force_direct: bool = False,
    minimum_z_height: Optional[float] = None,
    speed: Optional[float] = None,
    operation_volume: Optional[float] = None,
) -> MoveToWellOperationReturn:
    """Execute a move to well microoperation."""
    try:
        position = await movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            current_well=current_well,
            force_direct=force_direct,
            minimum_z_height=minimum_z_height,
            speed=speed,
            operation_volume=operation_volume,
        )
    except StallOrCollisionDetectedError as e:
        return DefinedErrorData(
            public=StallOrCollisionError(
                id=model_utils.generate_id(),
                createdAt=model_utils.get_timestamp(),
                wrappedErrors=[
                    ErrorOccurrence.from_failed(
                        id=model_utils.generate_id(),
                        createdAt=model_utils.get_timestamp(),
                        error=e,
                    )
                ],
            ),
            state_update=StateUpdate().clear_all_pipette_locations(),
        )
    else:
        deck_point = DeckPoint.construct(x=position.x, y=position.y, z=position.z)
        return SuccessData(
            public=DestinationPositionResult(
                position=deck_point,
            ),
            state_update=StateUpdate().set_pipette_location(
                pipette_id=pipette_id,
                new_labware_id=labware_id,
                new_well_name=well_name,
                new_deck_point=deck_point,
            ),
        )
