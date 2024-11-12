"""Prepare to aspirate command request, result, and implementation models."""

from __future__ import annotations
from opentrons_shared_data.errors.exceptions import PipetteOverpressureError
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from .pipetting_common import (
    OverpressureError,
    PipetteIdMixin,
    prepare_for_aspirate
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)
from ..errors.error_occurrence import ErrorOccurrence
from ..state import update_types

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover
    from ..resources import ModelUtils


PrepareToAspirateCommandType = Literal["prepareToAspirate"]


class PrepareToAspirateParams(PipetteIdMixin):
    """Parameters required to prepare a specific pipette for aspiration."""

    pass


class PrepareToAspirateResult(BaseModel):
    """Result data from execution of an PrepareToAspirate command."""

    pass


_ExecuteReturn = Union[
    SuccessData[PrepareToAspirateResult],
    DefinedErrorData[OverpressureError],
]


class PrepareToAspirateImplementation(
    AbstractCommandImpl[PrepareToAspirateParams, _ExecuteReturn]
):
    """Prepare for aspirate command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._pipetting_handler = pipetting
        self._model_utils = model_utils
        self._gantry_mover = gantry_mover

    def _transform_result(self, result: SuccessData[None]) -> SuccessData[PrepareToAspirateResult]:
        return SuccessData(public=PrepareToAspirateResult(), state_update=result.state_update)

    def _transform_error_with(self, current_position: Point) -> Callable[[DefinedErrorData[OverpressureError]], DefinedErrorData[OverpressureError]]:
        def _transform_error(self, error: DefinedErrorData[OverpressureError]) -> DefinedErrorData[OverpressureError]:
            return DefinedErrorData(
                public=error.copy(update={errorInfo: {"retryLocation": (
                                current_position.x,
                                current_position.y,
                                current_position.z,
                            )}}, deep=True),
                state_update=error.state_update
            )
        return _transform_error


    async def execute(self, params: PrepareToAspirateParams) -> _ExecuteReturn:
        """Prepare the pipette to aspirate."""
        error_transformer = self._transform_error_with(await self._gantry_mover.get_position(params.pipetteId))
        prepare_result = await prepare_for_aspirate(params.pipetteId, self._pipetting, self._model_utils)
        return prepare_result.and_then(self._transform_result).or_else(error_transformer)


class PrepareToAspirate(
    BaseCommand[PrepareToAspirateParams, PrepareToAspirateResult, ErrorOccurrence]
):
    """Prepare for aspirate command model."""

    commandType: PrepareToAspirateCommandType = "prepareToAspirate"
    params: PrepareToAspirateParams
    result: Optional[PrepareToAspirateResult]

    _ImplementationCls: Type[
        PrepareToAspirateImplementation
    ] = PrepareToAspirateImplementation


class PrepareToAspirateCreate(BaseCommandCreate[PrepareToAspirateParams]):
    """Prepare for aspirate command creation request model."""

    commandType: PrepareToAspirateCommandType = "prepareToAspirate"
    params: PrepareToAspirateParams

    _CommandCls: Type[PrepareToAspirate] = PrepareToAspirate
