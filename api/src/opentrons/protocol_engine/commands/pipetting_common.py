"""Common pipetting command base models."""

from __future__ import annotations
from opentrons_shared_data.errors import ErrorCodes
from pydantic import BaseModel, Field
from typing import Literal, Tuple, TypedDict, TYPE_CHECKING

from opentrons.protocol_engine.errors.error_occurrence import ErrorOccurrence
from opentrons_shared_data.errors.exceptions import PipetteOverpressureError
from .command import Maybe, DefinedErrorData, SuccessData
from opentrons.protocol_engine.state.update_types import StateUpdate


if TYPE_CHECKING:
    from ..execution.pipetting import PipettingHandler
    from ..resources import ModelUtils


class PipetteIdMixin(BaseModel):
    """Mixin for command requests that take a pipette ID."""

    pipetteId: str = Field(
        ...,
        description="Identifier of pipette to use for liquid handling.",
    )


class AspirateVolumeMixin(BaseModel):
    """Mixin for the `volume` field of aspirate commands."""

    volume: float = Field(
        ...,
        description="The amount of liquid to aspirate, in µL."
        " Must not be greater than the remaining available amount, which depends on"
        " the pipette (see `loadPipette`), its configuration (see `configureForVolume`),"
        " the tip (see `pickUpTip`), and the amount you've aspirated so far."
        " There is some tolerance for floating point rounding errors.",
        ge=0,
    )


class DispenseVolumeMixin(BaseModel):
    """Mixin for the `volume` field of dispense commands."""

    volume: float = Field(
        ...,
        description="The amount of liquid to dispense, in µL."
        " Must not be greater than the currently aspirated volume."
        " There is some tolerance for floating point rounding errors.",
        ge=0,
    )


class FlowRateMixin(BaseModel):
    """Mixin for command requests that take a flow rate."""

    flowRate: float = Field(
        ..., description="Speed in µL/s configured for the pipette", gt=0
    )


class BaseLiquidHandlingResult(BaseModel):
    """Base properties of a liquid handling result."""

    volume: float = Field(
        ...,
        description="Amount of liquid in uL handled in the operation.",
        ge=0,
    )


class ErrorLocationInfo(TypedDict):
    """Holds a retry location for in-place error recovery."""

    retryLocation: Tuple[float, float, float]


class OverpressureError(ErrorOccurrence):
    """Returned when sensors detect an overpressure error while moving liquid.

    The pipette plunger motion is stopped at the point of the error.

    The next thing to move the plunger must account for the robot not having a valid
    estimate of its position. It should be a `home`, `unsafe/updatePositionEstimators`,
    `unsafe/dropTipInPlace`, or `unsafe/blowOutInPlace`.
    """

    isDefined: bool = True

    errorType: Literal["overpressure"] = "overpressure"

    errorCode: str = ErrorCodes.PIPETTE_OVERPRESSURE.value.code
    detail: str = ErrorCodes.PIPETTE_OVERPRESSURE.value.detail

    errorInfo: ErrorLocationInfo


class LiquidNotFoundError(ErrorOccurrence):
    """Returned when no liquid is detected during the liquid probe process/move.

    After a failed probing, the pipette returns to the process start position.
    """

    isDefined: bool = True

    errorType: Literal["liquidNotFound"] = "liquidNotFound"

    errorCode: str = ErrorCodes.PIPETTE_LIQUID_NOT_FOUND.value.code
    detail: str = ErrorCodes.PIPETTE_LIQUID_NOT_FOUND.value.detail


class TipPhysicallyAttachedError(ErrorOccurrence):
    """Returned when sensors determine that a tip remains on the pipette after a drop attempt.

    The pipette will act as if the tip was not dropped. So, you won't be able to pick
    up a new tip without dropping the current one, and movement commands will assume
    there is a tip hanging off the bottom of the pipette.
    """

    isDefined: bool = True

    errorType: Literal["tipPhysicallyAttached"] = "tipPhysicallyAttached"

    errorCode: str = ErrorCodes.TIP_DROP_FAILED.value.code
    detail: str = ErrorCodes.TIP_DROP_FAILED.value.detail


PrepareForAspirateReturn = Maybe[
    SuccessData[BaseModel], DefinedErrorData[OverpressureError]
]


async def prepare_for_aspirate(
    pipette_id: str,
    pipetting: PipettingHandler,
    model_utils: ModelUtils,
    location_if_error: ErrorLocationInfo,
) -> PrepareForAspirateReturn:
    """Execute pipetting.prepare_for_aspirate, handle errors, and marshal success."""
    state_update = StateUpdate()
    try:
        await pipetting.prepare_for_aspirate(pipette_id)
    except PipetteOverpressureError as e:
        state_update.set_fluid_unknown(pipette_id=pipette_id)
        return PrepareForAspirateReturn.from_error(
            DefinedErrorData(
                public=OverpressureError(
                    id=model_utils.generate_id(),
                    createdAt=model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=model_utils.generate_id(),
                            createdAt=model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo=location_if_error,
                ),
                state_update=state_update,
            )
        )
    else:
        state_update.set_fluid_empty(pipette_id=pipette_id)
        return PrepareForAspirateReturn.from_result(
            SuccessData(public=BaseModel(), state_update=state_update)
        )
