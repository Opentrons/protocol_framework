"""Command models to retrieve a labware from a Flex Stacker."""

from __future__ import annotations
from typing import Optional, Literal, TYPE_CHECKING, Union
from typing_extensions import Type

from pydantic import BaseModel, Field

from ..command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..module_action_common import StackerShuttleEmptyError
from ...errors import (
    ErrorOccurrence,
    CannotPerformModuleAction,
    LabwareNotLoadedOnModuleError,
)
from ...resources import ModelUtils
from ...state import update_types
from ...types import (
    LabwareLocationSequence,
    InStackerHopperLocation,
)


if TYPE_CHECKING:
    from opentrons.protocol_engine.state.state import StateView
    from opentrons.protocol_engine.execution import EquipmentHandler


StoreCommandType = Literal["flexStacker/store"]


class StoreParams(BaseModel):
    """Input parameters for a labware storage command."""

    moduleId: str = Field(
        ...,
        description="Unique ID of the flex stacker.",
    )


class StoreResult(BaseModel):
    """Result data from a labware storage command."""

    eventualDestinationLocationSequence: LabwareLocationSequence | None = Field(
        None,
        description=("The full location in which this labware will eventually reside."),
    )
    originLocationSequence: LabwareLocationSequence | None = Field(
        None, description=("The origin location of the labware.")
    )


_ExecuteReturn = Union[
    SuccessData[StoreResult],
    DefinedErrorData[StackerShuttleEmptyError],
]


class StoreImpl(AbstractCommandImpl[StoreParams, _ExecuteReturn]):
    """Implementation of a labware storage command."""

    def __init__(
        self,
        state_view: StateView,
        equipment: EquipmentHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._equipment = equipment
        self._model_utils = model_utils

    async def execute(self, params: StoreParams) -> _ExecuteReturn:
        """Execute the labware storage command."""
        stacker_state = self._state_view.modules.get_flex_stacker_substate(
            params.moduleId
        )
        if stacker_state.in_static_mode:
            raise CannotPerformModuleAction(
                "Cannot store labware in Flex Stacker while in static mode"
            )

        # Allow propagation of ModuleNotAttachedError.
        stacker_hw = self._equipment.get_module_hardware_api(stacker_state.module_id)

        try:
            lw_id = self._state_view.labware.get_id_by_module(params.moduleId)
        except LabwareNotLoadedOnModuleError as e:
            return DefinedErrorData(
                public=StackerShuttleEmptyError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                ),
                state_update=None,
            )

        original_location_sequence = self._state_view.geometry.get_location_sequence(
            lw_id
        )
        eventual_target_location_sequence = (
            self._state_view.geometry.get_predicted_location_sequence(
                InStackerHopperLocation(moduleId=params.moduleId)
            )
        )
        labware_defs = [self._state_view.labware.get_definition(lw_id)]
        lid_id = self._state_view.labware.get_lid_id_by_labware_id(lw_id)
        if lid_id is not None:
            labware_defs = [
                self._state_view.labware.get_definition(lid_id),
                labware_defs[0],
            ]
        stack_height = self._state_view.geometry.get_height_of_labware_stack(
            labware_defs
        )

        # TODO: check the type of the labware should match that already in the stack
        state_update = update_types.StateUpdate()

        if stacker_hw is not None:
            await stacker_hw.store_labware(labware_height=stack_height)

        # update the state to reflect the labware is store in the stack
        state_update.set_labware_location(
            labware_id=lw_id,
            new_location=InStackerHopperLocation(moduleId=params.moduleId),
            new_offset_id=None,
        )
        state_update.store_flex_stacker_labware(
            module_id=params.moduleId, labware_id=lw_id
        )

        return SuccessData(
            public=StoreResult(
                originLocationSequence=original_location_sequence,
                eventualDestinationLocationSequence=eventual_target_location_sequence,
            ),
            state_update=state_update,
        )


class Store(BaseCommand[StoreParams, StoreResult, ErrorOccurrence]):
    """A command to store a labware in a Flex Stacker."""

    commandType: StoreCommandType = "flexStacker/store"
    params: StoreParams
    result: Optional[StoreResult] = None

    _ImplementationCls: Type[StoreImpl] = StoreImpl


class StoreCreate(BaseCommandCreate[StoreParams]):
    """A request to execute a Flex Stacker store command."""

    commandType: StoreCommandType = "flexStacker/store"
    params: StoreParams

    _CommandCls: Type[Store] = Store
