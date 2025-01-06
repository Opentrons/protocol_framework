"""Command models to retrieve a labware from a Flex Stacker."""
from __future__ import annotations
from typing import Optional, Literal
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence


StoreCommandType = Literal["flexStacker/store"]


class StoreParams(BaseModel):
    """Input parameters for a labware storage command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the flex stacker.",
    )


class StoreResult(BaseModel):
    """Result data from a labware storage command."""


class StoreImpl(AbstractCommandImpl[StoreParams, SuccessData[StoreResult]]):
    """Implementation of a labware storage command."""

    def __init__(
        self,
        **kwargs: object,
    ) -> None:
        pass

    async def execute(self, params: StoreParams) -> SuccessData[StoreResult]:
        """Execute the labware storage command."""
        return SuccessData(public=StoreResult())
    

class Store(BaseCommand[StoreParams, StoreResult, ErrorOccurrence]):
    """A command to store a labware in a Flex Stacker."""

    commandType: StoreCommandType = "flexStacker/store"
    params: StoreParams
    result: Optional[StoreResult]

    _ImplementationCls: Type[StoreImpl] = StoreImpl


class StoreCreate(BaseCommandCreate[StoreParams]):
    """A request to execute a Flex Stacker store command."""

    commandType: StoreCommandType = "flexStacker/store"
    params: StoreParams

    _CommandCls: Type[Store] = Store
