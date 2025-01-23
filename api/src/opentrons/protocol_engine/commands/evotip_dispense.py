"""Evotip Dispense-in-place command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal
from pydantic import Field

from opentrons.protocol_engine.errors import UnsupportedLabwareForActionError
from .pipetting_common import (
    PipetteIdMixin,
    FlowRateMixin,
    DispenseVolumeMixin,
    BaseLiquidHandlingResult,
    dispense_in_place,
)
from .movement_common import (
    LiquidHandlingWellLocationMixin,
    StallOrCollisionError,
    move_to_well,
)

from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..resources import labware_validation
from ..state.update_types import CLEAR
from ..types import CurrentWell

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover, MovementHandler
    from ..resources import ModelUtils
    from ..state.state import StateView


EvotipDispenseCommandType = Literal["evotipDispense"]


class EvotipDispenseParams(
    PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin, LiquidHandlingWellLocationMixin
):
    """Payload required to dispense in place."""

    pushOut: Optional[float] = Field(
        None,
        description="Push the plunger a small amount farther than necessary for accurate low-volume dispensing",
    )


class EvotipDispenseResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseInPlace command."""

    pass


_ExecuteReturn = Union[
    SuccessData[EvotipDispenseResult],
    DefinedErrorData[StallOrCollisionError],
]


class EvotipDispenseImplementation(
    AbstractCommandImpl[EvotipDispenseParams, _ExecuteReturn]
):
    """DispenseInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        gantry_mover: GantryMover,
        model_utils: ModelUtils,
        movement: MovementHandler,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._gantry_mover = gantry_mover
        self._model_utils = model_utils
        self._movement = movement

    async def execute(self, params: EvotipDispenseParams) -> _ExecuteReturn:
        """Move to and dispense to the requested well."""
        well_location = params.wellLocation
        labware_id = params.labwareId
        well_name = params.wellName

        labware_definition = self._state_view.labware.get_definition(params.labwareId)
        if not labware_validation.is_evotips(labware_definition.parameters.loadName):
            raise UnsupportedLabwareForActionError(
                f"Cannot use command: `EvotipDispense` with labware: {labware_definition.parameters.loadName}"
            )
        move_result = await move_to_well(
            movement=self._movement,
            model_utils=self._model_utils,
            pipette_id=params.pipetteId,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        current_location = self._state_view.pipettes.get_current_location()
        current_position = await self._gantry_mover.get_position(params.pipetteId)
        result = await dispense_in_place(
            pipette_id=params.pipetteId,
            volume=params.volume,
            flow_rate=params.flowRate,
            push_out=params.pushOut,
            location_if_error={
                "retryLocation": (
                    current_position.x,
                    current_position.y,
                    current_position.z,
                )
            },
            pipetting=self._pipetting,
            model_utils=self._model_utils,
        )

        if (
            isinstance(current_location, CurrentWell)
            and current_location.pipette_id == params.pipetteId
        ):
            volume_added = (
                self._state_view.pipettes.get_liquid_dispensed_by_ejecting_volume(
                    pipette_id=params.pipetteId, volume=result.public.volume
                )
            )
            if volume_added is not None:
                volume_added *= self._state_view.geometry.get_nozzles_per_well(
                    current_location.labware_id,
                    current_location.well_name,
                    params.pipetteId,
                )
            return SuccessData(
                public=EvotipDispenseResult(volume=result.public.volume),
                state_update=result.state_update.set_liquid_operated(
                    labware_id=current_location.labware_id,
                    well_names=self._state_view.geometry.get_wells_covered_by_pipette_with_active_well(
                        current_location.labware_id,
                        current_location.well_name,
                        params.pipetteId,
                    ),
                    volume_added=volume_added if volume_added is not None else CLEAR,
                ),
            )
        else:
            return SuccessData(
                public=EvotipDispenseResult(volume=result.public.volume),
                state_update=result.state_update,
            )


class EvotipDispense(
    BaseCommand[EvotipDispenseParams, EvotipDispenseResult, StallOrCollisionError]
):
    """DispenseInPlace command model."""

    commandType: EvotipDispenseCommandType = "evotipDispense"
    params: EvotipDispenseParams
    result: Optional[EvotipDispenseResult]

    _ImplementationCls: Type[
        EvotipDispenseImplementation
    ] = EvotipDispenseImplementation


class EvotipDispenseCreate(BaseCommandCreate[EvotipDispenseParams]):
    """DispenseInPlace command request model."""

    commandType: EvotipDispenseCommandType = "evotipDispense"
    params: EvotipDispenseParams

    _CommandCls: Type[EvotipDispense] = EvotipDispense
