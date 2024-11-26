"""Pick up next tip command request, result, and implementation models."""

from __future__ import annotations
from opentrons_shared_data.errors import ErrorCodes
from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type, Union, List
from typing_extensions import Literal


from ..errors import ErrorOccurrence, PickUpTipTipNotAttachedError
from ..resources import ModelUtils
from ..state import update_types
from ..types import PickUpTipWellLocation, WellLocation, WellOrigin, WellOffset
from .pipetting_common import (
    PipetteIdMixin,
)
from .movement_common import (
    DestinationPositionResult,
    StallOrCollisionError,
    move_to_well,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)

if TYPE_CHECKING:
    from ..state.state import StateView
    from ..execution import MovementHandler, TipHandler


PickUpNextTipCommandType = Literal["pickUpNextTip"]


class PickUpNextTipParams(PipetteIdMixin):
    """Payload needed to move a pipette to the next available tip."""

    labwareIds: List[str] = Field(..., description="Identifier of labware to use.")
    startingWellName: Optional[str] = Field(
        "A1", description="Name of well to use in labware."
    )


class PickUpNextTipResult(DestinationPositionResult):
    """Result data from the execution of a PickUpNextTip."""

    tipVolume: float = Field(
        ...,
        description="Maximum volume of liquid that the picked up tip can hold, in µL.",
        ge=0,
    )

    tipLength: float = Field(
        0,
        description="The length of the tip in mm.",
        ge=0,
    )

    tipDiameter: float = Field(
        0,
        description="The diameter of the tip in mm.",
        ge=0,
    )


# TODO import this from pick_up_tip? (prob not). Move to another location (more likely)
class TipPhysicallyMissingError(ErrorOccurrence):
    """Returned when sensors determine that no tip was physically picked up.

    That space in the tip rack is marked internally as not having any tip,
    as if the tip were consumed by a pickup.

    The pipette will act as if no tip was picked up. So, you won't be able to aspirate
    anything, and movement commands will assume there is no tip hanging off the bottom
    of the pipette.
    """

    # The thing above about marking the tips as used makes it so that
    # when the protocol is resumed and the Python Protocol API calls
    # `get_next_tip()`, we'll move on to other tips as expected.

    isDefined: bool = True
    errorType: Literal["tipPhysicallyMissing"] = "tipPhysicallyMissing"
    errorCode: str = ErrorCodes.TIP_PICKUP_FAILED.value.code
    detail: str = "No Tip Detected"


_ExecuteReturn = Union[
    SuccessData[PickUpNextTipResult],
    DefinedErrorData[TipPhysicallyMissingError]
    | DefinedErrorData[StallOrCollisionError],
]


class PickUpNextTipImplementation(
    AbstractCommandImpl[PickUpNextTipParams, _ExecuteReturn]
):
    """Pick up next tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        model_utils: ModelUtils,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._model_utils = model_utils
        self._movement = movement

    async def execute(
        self, params: PickUpNextTipParams
    ) -> Union[SuccessData[PickUpNextTipResult], _ExecuteReturn]:
        """Move to and pick up the next available tip using the requested pipette."""
        pipette_id = params.pipetteId
        starting_tip_name = params.startingWellName

        num_tips = self._state_view.tips.get_pipette_active_channels(pipette_id)

        for labware_id in params.labwareIds:
            well_name = self._state_view.tips.get_next_tip(
                labware_id=labware_id,
                num_tips=num_tips,
                starting_tip_name=starting_tip_name,
                nozzle_map=None,  # TODO add this in at some point
            )
            if well_name is not None:
                break
        else:
            raise ValueError("BLAH BLAH BLAH")

        # TODO honestly I'm not sure if we need to find the well top or if this is a pointless step
        #   for automatic tip stuff but
        well_top = self._state_view.geometry.get_well_position(
            well_name=well_name,
            labware_id=labware_id,
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=0)
            ),  # TODO these are default values so could remove this, maybe
        )
        well_location = self._state_view.geometry.get_relative_well_location(
            labware_id=labware_id,
            well_name=well_name,
            absolute_point=well_top,
        )

        move_result = await move_to_well(
            movement=self._movement,
            model_utils=self._model_utils,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        try:
            tip_geometry = await self._tip_handler.pick_up_tip(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
            )
        except PickUpTipTipNotAttachedError as e:
            state_update_if_false_positive = (
                update_types.StateUpdate.reduce(
                    update_types.StateUpdate(), move_result.state_update
                )
                .update_pipette_tip_state(
                    pipette_id=pipette_id,
                    tip_geometry=e.tip_geometry,
                )
                .set_fluid_empty(pipette_id=pipette_id)
                .mark_tips_as_used(
                    pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
                )
            )
            state_update = (
                update_types.StateUpdate.reduce(
                    update_types.StateUpdate(), move_result.state_update
                )
                .mark_tips_as_used(
                    pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
                )
                .set_fluid_unknown(pipette_id=pipette_id)
            )
            return DefinedErrorData(
                public=TipPhysicallyMissingError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                ),
                state_update=state_update,
                state_update_if_false_positive=state_update_if_false_positive,
            )
        else:
            state_update = (
                move_result.state_update.update_pipette_tip_state(
                    pipette_id=pipette_id,
                    tip_geometry=tip_geometry,
                )
                .mark_tips_as_used(
                    pipette_id=pipette_id, labware_id=labware_id, well_name=well_name
                )
                .set_fluid_empty(pipette_id=pipette_id)
            )
            return SuccessData(
                public=PickUpNextTipResult(
                    tipVolume=tip_geometry.volume,
                    tipLength=tip_geometry.length,
                    tipDiameter=tip_geometry.diameter,
                    position=move_result.public.position,
                ),
                state_update=state_update,
            )


class PickUpNextTip(
    BaseCommand[
        PickUpNextTipParams,
        PickUpNextTipResult,
        TipPhysicallyMissingError | StallOrCollisionError,
    ]
):
    """Pick up next tip command model."""

    commandType: PickUpNextTipCommandType = "pickUpNextTip"
    params: PickUpNextTipParams
    result: Optional[PickUpNextTipResult]

    _ImplementationCls: Type[PickUpNextTipImplementation] = PickUpNextTipImplementation


class PickUpNextTipCreate(BaseCommandCreate[PickUpNextTipParams]):
    """Pick up next tip command creation request model."""

    commandType: PickUpNextTipCommandType = "pickUpNextTip"
    params: PickUpNextTipParams

    _CommandCls: Type[PickUpNextTip] = PickUpNextTip
