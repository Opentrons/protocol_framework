"""Get next tip command request, result, and implementation models."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type, List, Literal


from ..errors import ErrorOccurrence
from .pipetting_common import PipetteIdMixin

from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)

if TYPE_CHECKING:
    from ..state.state import StateView


GetNextTipCommandType = Literal["getNextTip"]


class GetNextTipParams(PipetteIdMixin):
    """Payload needed to resolve the next available tip."""

    labwareIds: List[str] = Field(
        ...,  # TODO order matters
        description="Labware ID(s) of tip racks to resolve next available tip(s) from.",
    )
    startingWellName: Optional[str] = Field(
        "A1", description="Name of starting tip rack 'well'."
    )


class GetNextTipResult(BaseModel):
    """Result data from the execution of a GetNextTip."""

    labwareId: Optional[str] = Field(
        ..., description="Labware ID where next available tip is, if any."
    )
    wellName: Optional[str] = Field(
        ..., description="Well name of next available tip, if any."
    )


class GetNextTipImplementation(
    AbstractCommandImpl[GetNextTipParams, SuccessData[GetNextTipResult]]
):
    """Get next tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view

    async def execute(self, params: GetNextTipParams) -> SuccessData[GetNextTipResult]:
        """Get the next available tip for the requested pipette."""
        pipette_id = params.pipetteId
        starting_tip_name = params.startingWellName

        num_tips = self._state_view.tips.get_pipette_active_channels(pipette_id)
        total_tips = self._state_view.tips.get_pipette_channels(pipette_id)
        nozzle_map = (
            self._state_view.tips.get_pipette_nozzle_map(pipette_id)
            if num_tips != total_tips
            else None
        )

        labware_id: Optional[str]
        for labware_id in params.labwareIds:
            well_name = self._state_view.tips.get_next_tip(
                labware_id=labware_id,
                num_tips=num_tips,
                starting_tip_name=starting_tip_name,
                nozzle_map=nozzle_map,
            )
            if well_name is not None:
                break
        else:
            labware_id = None
            well_name = None

        return SuccessData(
            public=GetNextTipResult(
                labwareId=labware_id,
                wellName=well_name,
            )
        )


class GetNextTip(BaseCommand[GetNextTipParams, GetNextTipResult, ErrorOccurrence]):
    """Get next tip command model."""

    commandType: GetNextTipCommandType = "getNextTip"
    params: GetNextTipParams
    result: Optional[GetNextTipResult]

    _ImplementationCls: Type[GetNextTipImplementation] = GetNextTipImplementation


class GetNextTipCreate(BaseCommandCreate[GetNextTipParams]):
    """Get next tip command creation request model."""

    commandType: GetNextTipCommandType = "getNextTip"
    params: GetNextTipParams

    _CommandCls: Type[GetNextTip] = GetNextTip
