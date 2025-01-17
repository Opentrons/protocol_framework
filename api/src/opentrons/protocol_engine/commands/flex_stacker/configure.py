"""Command models to update configurations of a Flex Stacker."""
from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors import (
    ErrorOccurrence,
)
from ...state import update_types

if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView

ConfigureCommandType = Literal["flexStacker/configure"]


class ConfigureParams(BaseModel):
    """Input parameters for a configure command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the Flex Stacker.",
    )
    static: Optional[bool] = Field(
        None,
        description="Whether the Flex Stacker should be in static mode.",
    )


class ConfigureResult(BaseModel):
    """Result data from a configure command."""


class ConfigureImpl(AbstractCommandImpl[ConfigureParams, SuccessData[ConfigureResult]]):
    """Implementation of a configure command."""

    def __init__(
        self,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view

    async def execute(self, params: ConfigureParams) -> SuccessData[ConfigureResult]:
        """Execute the configurecommand."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        state_update = update_types.StateUpdate()
        if params.static is not None:
            state_update.update_flex_stacker_mode(
                module_id=stacker_state.module_id, static_mode=params.static
            )
        return SuccessData(public=ConfigureResult(), state_update=state_update)


class Configure(BaseCommand[ConfigureParams, ConfigureResult, ErrorOccurrence]):
    """A command to configure the Flex Stacker."""

    commandType: ConfigureCommandType = "flexStacker/configure"
    params: ConfigureParams
    result: Optional[ConfigureResult]

    _ImplementationCls: Type[ConfigureImpl] = ConfigureImpl


class ConfigureCreate(BaseCommandCreate[ConfigureParams]):
    """A request to execute a Flex Stacker Configure command."""

    commandType: ConfigureCommandType = "flexStacker/configure"
    params: ConfigureParams

    _CommandCls: Type[Configure] = Configure
