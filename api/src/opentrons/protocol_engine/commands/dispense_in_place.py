"""Dispense-in-place command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal
from pydantic import Field

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from .pipetting_common import (
    PipetteIdMixin,
    DispenseVolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
    OverpressureError,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..errors.error_occurrence import ErrorOccurrence
from ..state.update_types import StateUpdate, CLEAR
from ..types import CurrentWell

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover
    from ..resources import ModelUtils
    from ..state.state import StateView


DispenseInPlaceCommandType = Literal["dispenseInPlace"]


class DispenseInPlaceParams(PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin):
    """Payload required to dispense in place."""

    pushOut: Optional[float] = Field(
        None,
        description="push the plunger a small amount farther than necessary for accurate low-volume dispensing",
    )


class DispenseInPlaceResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseInPlace command."""

    pass


_ExecuteReturn = Union[
    SuccessData[DispenseInPlaceResult],
    DefinedErrorData[OverpressureError],
]


class DispenseInPlaceImplementation(
    AbstractCommandImpl[DispenseInPlaceParams, _ExecuteReturn]
):
    """DispenseInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        gantry_mover: GantryMover,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._gantry_mover = gantry_mover
        self._model_utils = model_utils

    async def execute(self, params: DispenseInPlaceParams) -> _ExecuteReturn:
        """Dispense without moving the pipette."""
        state_update = StateUpdate()
        current_location = self._state_view.pipettes.get_current_location()
        try:
            current_position = await self._gantry_mover.get_position(params.pipetteId)
            volume = await self._pipetting.dispense_in_place(
                pipette_id=params.pipetteId,
                volume=params.volume,
                flow_rate=params.flowRate,
                push_out=params.pushOut,
            )
        except PipetteOverpressureError as e:
            if (
                isinstance(current_location, CurrentWell)
                and current_location.pipette_id == params.pipetteId
            ):
                state_update.set_liquid_operated(
                    labware_id=current_location.labware_id,
                    well_name=current_location.well_name,
                    volume_added=CLEAR,
                )
            return DefinedErrorData(
                public=OverpressureError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo=(
                        {
                            "retryLocation": (
                                current_position.x,
                                current_position.y,
                                current_position.z,
                            )
                        }
                    ),
                ),
                state_update=state_update,
            )
        else:
            if (
                isinstance(current_location, CurrentWell)
                and current_location.pipette_id == params.pipetteId
            ):
                state_update.set_liquid_operated(
                    labware_id=current_location.labware_id,
                    well_name=current_location.well_name,
                    volume_added=volume,
                )
            return SuccessData(
                public=DispenseInPlaceResult(volume=volume),
                state_update=state_update,
            )


class DispenseInPlace(
    BaseCommand[DispenseInPlaceParams, DispenseInPlaceResult, OverpressureError]
):
    """DispenseInPlace command model."""

    commandType: DispenseInPlaceCommandType = "dispenseInPlace"
    params: DispenseInPlaceParams
    result: Optional[DispenseInPlaceResult]

    _ImplementationCls: Type[
        DispenseInPlaceImplementation
    ] = DispenseInPlaceImplementation


class DispenseInPlaceCreate(BaseCommandCreate[DispenseInPlaceParams]):
    """DispenseInPlace command request model."""

    commandType: DispenseInPlaceCommandType = "dispenseInPlace"
    params: DispenseInPlaceParams

    _CommandCls: Type[DispenseInPlace] = DispenseInPlace
