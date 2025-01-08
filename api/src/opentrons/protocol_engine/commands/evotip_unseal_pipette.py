"""Unseal evotip resin tip command request, result, and implementation models."""

from __future__ import annotations

from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.protocol_engine.resources.model_utils import ModelUtils

from ..types import DropTipWellLocation
from .pipetting_common import (
    PipetteIdMixin,
)
from .movement_common import (
    DestinationPositionResult,
    move_to_well,
    StallOrCollisionError,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)
from ..resources import labware_validation

if TYPE_CHECKING:
    from ..state.state import StateView
    from ..execution import MovementHandler, TipHandler


EvotipUnsealPipetteCommandType = Literal["evotipUnsealPipette"]


class EvotipUnsealPipetteParams(PipetteIdMixin):
    """Payload required to drop a tip in a specific well."""

    labwareId: str = Field(..., description="Identifier of labware to use.")
    wellName: str = Field(..., description="Name of well to use in labware.")
    wellLocation: DropTipWellLocation = Field(
        default_factory=DropTipWellLocation,
        description="Relative well location at which to drop the tip.",
    )
    homeAfter: Optional[bool] = Field(
        None,
        description=(
            "Whether to home this pipette's plunger after dropping the tip."
            " You should normally leave this unspecified to let the robot choose"
            " a safe default depending on its hardware."
        ),
    )


class EvotipUnsealResult(DestinationPositionResult):
    """Result data from the execution of a DropTip command."""

    pass


_ExecuteReturn = (
    SuccessData[EvotipUnsealResult] | DefinedErrorData[StallOrCollisionError]
)


class EvotipUnsealPipetteImplementation(
    AbstractCommandImpl[EvotipUnsealPipetteParams, _ExecuteReturn]
):
    """Drop tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        movement: MovementHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._movement_handler = movement
        self._model_utils = model_utils

    async def execute(self, params: EvotipUnsealPipetteParams) -> _ExecuteReturn:
        """Move to and drop a tip using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName
        home_after = params.homeAfter

        well_location = params.wellLocation
        if not labware_validation.is_evotips(
            self._state_view.labware.get_definition(params.labwareId).parameters.loadName
        ):
            raise ValueError()
        is_partially_configured = self._state_view.pipettes.get_is_partially_configured(
            pipette_id=pipette_id
        )
        tip_drop_location = self._state_view.geometry.get_checked_tip_drop_location(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_location=well_location,
            partially_configured=is_partially_configured,
        )

        move_result = await move_to_well(
            movement=self._movement_handler,
            model_utils=self._model_utils,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=tip_drop_location,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        await self._tip_handler.drop_tip(pipette_id=pipette_id, home_after=home_after)
    
        return SuccessData(
            public=EvotipUnsealResult(position=move_result.public.position),
            state_update=move_result.state_update.set_fluid_unknown(
                pipette_id=pipette_id
            ).update_pipette_tip_state(pipette_id=params.pipetteId, tip_geometry=None),
        )


class EvotipUnsealPipette(
    BaseCommand[EvotipUnsealPipetteParams, EvotipUnsealResult, StallOrCollisionError]
):
    """Evotip unseal command model."""

    commandType: EvotipUnsealPipetteCommandType = "evotipUnsealPipette"
    params: EvotipUnsealPipetteParams
    result: Optional[EvotipUnsealResult]

    _ImplementationCls: Type[
        EvotipUnsealPipetteImplementation
    ] = EvotipUnsealPipetteImplementation


class EvotipUnsealCreate(BaseCommandCreate[EvotipUnsealPipetteParams]):
    """Evotip unseal command creation request model."""

    commandType: EvotipUnsealPipetteCommandType = "evotipUnsealPipette"
    params: EvotipUnsealPipetteParams

    _CommandCls: Type[EvotipUnsealPipette] = EvotipUnsealPipette
