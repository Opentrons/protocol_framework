"""Move to well command request, result, and implementation models."""

from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .pipetting_common import (
    PipetteIdMixin,
)
from .movement_common import (
    WellLocationMixin,
    MovementMixin,
    DestinationPositionResult,
    move_to_well,
)
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from ..errors import LabwareIsTipRackError

if TYPE_CHECKING:
    from ..execution import MovementHandler
    from ..state.state import StateView

MoveToWellCommandType = Literal["moveToWell"]


class MoveToWellParams(PipetteIdMixin, WellLocationMixin, MovementMixin):
    """Payload required to move a pipette to a specific well."""

    pass


class MoveToWellResult(DestinationPositionResult):
    """Result data from the execution of a MoveToWell command."""

    pass


class MoveToWellImplementation(
    AbstractCommandImpl[MoveToWellParams, SuccessData[MoveToWellResult]]
):
    """Move to well command implementation."""

    def __init__(
        self, state_view: StateView, movement: MovementHandler, **kwargs: object
    ) -> None:
        self._state_view = state_view
        self._movement = movement

    async def execute(self, params: MoveToWellParams) -> SuccessData[MoveToWellResult]:
        """Move the requested pipette to the requested well."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName
        well_location = params.wellLocation

        if (
            self._state_view.labware.is_tiprack(labware_id)
            and well_location.volumeOffset
        ):
            raise LabwareIsTipRackError(
                "Cannot specify a WellLocation with a volumeOffset with movement to a tip rack"
            )

        move_result = await move_to_well(
            movement=self._movement,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
            force_direct=params.forceDirect,
            minimum_z_height=params.minimumZHeight,
            speed=params.speed,
        )

        return SuccessData(
            public=MoveToWellResult(position=move_result.public.position),
            state_update=move_result.state_update,
        )


class MoveToWell(BaseCommand[MoveToWellParams, MoveToWellResult, ErrorOccurrence]):
    """Move to well command model."""

    commandType: MoveToWellCommandType = "moveToWell"
    params: MoveToWellParams
    result: Optional[MoveToWellResult]

    _ImplementationCls: Type[MoveToWellImplementation] = MoveToWellImplementation


class MoveToWellCreate(BaseCommandCreate[MoveToWellParams]):
    """Move to well command creation request model."""

    commandType: MoveToWellCommandType = "moveToWell"
    params: MoveToWellParams

    _CommandCls: Type[MoveToWell] = MoveToWell
