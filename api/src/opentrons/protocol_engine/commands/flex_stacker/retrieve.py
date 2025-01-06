"""Command models to retrieve a labware from a Flex Stacker."""
from __future__ import annotations
from typing import Optional, Literal
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ...errors.error_occurrence import ErrorOccurrence


RetrieveCommandType = Literal["flexStacker/retrieve"]


class RetrieveParams(BaseModel):
    """Input parameters for a labware retrieval command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the Flex Stacker.",
    )


class RetrieveResult(BaseModel):
    """Result data from a labware retrieval command."""


# TODO: Implement the command
class RetrieveImpl(AbstractCommandImpl[RetrieveParams, SuccessData[RetrieveResult]]):
    """Implementation of a labware retrieval command."""

    def __init__(
        self,
        **kwargs: object,
    ) -> None:
        pass

    async def execute(self, params: RetrieveParams) -> SuccessData[RetrieveResult]:
        """Execute the labware retrieval command."""
        return SuccessData(public=RetrieveResult())


class Retrieve(BaseCommand[RetrieveParams, RetrieveResult, ErrorOccurrence]):
    """A command to retrieve a labware from a Flex Stacker."""

    commandType: RetrieveCommandType = "flexStacker/retrieve"
    params: RetrieveParams
    result: Optional[RetrieveResult]

    _ImplementationCls: Type[RetrieveImpl] = RetrieveImpl


class RetrieveCreate(BaseCommandCreate[RetrieveParams]):
    """A request to execute a Flex Stacker retrieve command."""

    commandType: RetrieveCommandType = "flexStacker/retrieve"
    params: RetrieveParams

    _CommandCls: Type[Retrieve] = Retrieve
