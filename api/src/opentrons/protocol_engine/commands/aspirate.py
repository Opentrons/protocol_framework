"""Aspirate command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from .pipetting_common import (
    OverpressureError,
    PipetteIdMixin,
    AspirateVolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
    aspirate_in_place,
)
from .movement_common import (
    LiquidHandlingWellLocationMixin,
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

from opentrons.hardware_control import HardwareControlAPI

from ..state.update_types import StateUpdate, CLEAR
from ..types import (
    WellLocation,
    WellOrigin,
    CurrentWell,
)

if TYPE_CHECKING:
    from ..execution import MovementHandler, PipettingHandler
    from ..resources import ModelUtils
    from ..state.state import StateView
    from ..notes import CommandNoteAdder


AspirateCommandType = Literal["aspirate"]


class AspirateParams(
    PipetteIdMixin, AspirateVolumeMixin, FlowRateMixin, LiquidHandlingWellLocationMixin
):
    """Parameters required to aspirate from a specific well."""

    pass


class AspirateResult(BaseLiquidHandlingResult, DestinationPositionResult):
    """Result data from execution of an Aspirate command."""

    pass


_ExecuteReturn = Union[
    SuccessData[AspirateResult],
    DefinedErrorData[OverpressureError] | DefinedErrorData[StallOrCollisionError],
]


class AspirateImplementation(AbstractCommandImpl[AspirateParams, _ExecuteReturn]):
    """Aspirate command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        movement: MovementHandler,
        command_note_adder: CommandNoteAdder,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._state_view = state_view
        self._hardware_api = hardware_api
        self._movement = movement
        self._command_note_adder = command_note_adder
        self._model_utils = model_utils

    async def execute(self, params: AspirateParams) -> _ExecuteReturn:
        """Move to and aspirate from the requested well.

        Raises:
            TipNotAttachedError: if no tip is attached to the pipette.
        """
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        ready_to_aspirate = self._pipetting.get_is_ready_to_aspirate(
            pipette_id=pipette_id
        )

        current_well = None

        if not ready_to_aspirate:
            await self._movement.move_to_well(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=WellLocation(origin=WellOrigin.TOP),
            )

            await self._pipetting.prepare_for_aspirate(pipette_id=pipette_id)

            # set our current deck location to the well now that we've made
            # an intermediate move for the "prepare for aspirate" step
            current_well = CurrentWell(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
            )

        move_result = await move_to_well(
            movement=self._movement,
            model_utils=self._model_utils,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=params.wellLocation,
            current_well=current_well,
            operation_volume=-params.volume,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        aspirate_result = await aspirate_in_place(
            pipette_id=pipette_id,
            volume=params.volume,
            flow_rate=params.flowRate,
            location_if_error={
                "retryLocation": (
                    move_result.public.position.x,
                    move_result.public.position.y,
                    move_result.public.position.z,
                )
            },
            command_note_adder=self._command_note_adder,
            pipetting=self._pipetting,
            model_utils=self._model_utils,
        )
        if isinstance(aspirate_result, DefinedErrorData):
            return DefinedErrorData(
                public=aspirate_result.public,
                state_update=StateUpdate.reduce(
                    move_result.state_update, aspirate_result.state_update
                ).set_liquid_operated(
                    labware_id=labware_id,
                    well_names=self._state_view.geometry.get_wells_covered_by_pipette_with_active_well(
                        labware_id,
                        well_name,
                        params.pipetteId,
                    ),
                    volume_added=CLEAR,
                ),
                state_update_if_false_positive=StateUpdate.reduce(
                    move_result.state_update,
                    aspirate_result.state_update_if_false_positive,
                ),
            )
        else:
            return SuccessData(
                public=AspirateResult(
                    volume=aspirate_result.public.volume,
                    position=move_result.public.position,
                ),
                state_update=StateUpdate.reduce(
                    move_result.state_update, aspirate_result.state_update
                ).set_liquid_operated(
                    labware_id=labware_id,
                    well_names=self._state_view.geometry.get_wells_covered_by_pipette_with_active_well(
                        labware_id, well_name, pipette_id
                    ),
                    volume_added=-aspirate_result.public.volume
                    * self._state_view.geometry.get_nozzles_per_well(
                        labware_id,
                        well_name,
                        params.pipetteId,
                    ),
                ),
            )


class Aspirate(
    BaseCommand[
        AspirateParams, AspirateResult, OverpressureError | StallOrCollisionError
    ]
):
    """Aspirate command model."""

    commandType: AspirateCommandType = "aspirate"
    params: AspirateParams
    result: Optional[AspirateResult]

    _ImplementationCls: Type[AspirateImplementation] = AspirateImplementation


class AspirateCreate(BaseCommandCreate[AspirateParams]):
    """Create aspirate command request model."""

    commandType: AspirateCommandType = "aspirate"
    params: AspirateParams

    _CommandCls: Type[Aspirate] = Aspirate
