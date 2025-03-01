"""Flex Stacker substate."""

from dataclasses import dataclass
from typing import NewType, List
from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons.protocol_engine.state.update_types import (
    FlexStackerStateUpdate,
    FlexStackerLoadHopperLabware,
    FlexStackerRetrieveLabware,
    FlexStackerStoreLabware,
    NO_CHANGE,
)


FlexStackerId = NewType("FlexStackerId", str)


@dataclass(frozen=True)
class FlexStackerSubState:
    """Flex Stacker-specific state.

    Provides calculations and read-only state access
    for an individual loaded Flex Stacker Module.
    """

    module_id: FlexStackerId
    in_static_mode: bool
    hopper_labware_ids: List[str]
    pool_primary_definition: LabwareDefinition | None
    pool_adapter_definition: LabwareDefinition | None
    pool_lid_definition: LabwareDefinition | None
    pool_count: int
    max_pool_count: int

    def new_from_state_change(
        self, update: FlexStackerStateUpdate
    ) -> "FlexStackerSubState":
        """Return a new state with the given update applied."""
        new_mode = self.in_static_mode
        if update.in_static_mode != NO_CHANGE:
            new_mode = update.in_static_mode

        pool_primary_definition = self.pool_primary_definition
        pool_adapter_definition = self.pool_adapter_definition
        pool_lid_definition = self.pool_lid_definition
        max_pool_count = self.max_pool_count
        if update.pool_constraint != NO_CHANGE:
            max_pool_count = update.pool_constraint.max_pool_count
            pool_primary_definition = update.pool_constraint.primary_definition
            pool_adapter_definition = update.pool_constraint.adapter_definition
            pool_lid_definition = update.pool_constraint.lid_definition

        pool_count = self.pool_count
        if update.pool_count != NO_CHANGE:
            pool_count = update.pool_count

        lw_change = update.hopper_labware_update
        new_labware_ids = self.hopper_labware_ids.copy()

        if lw_change != NO_CHANGE:
            # TODO the labware stack needs to be handled more elegantly
            # this is a temporary solution to enable evt testing
            if isinstance(lw_change, FlexStackerLoadHopperLabware):
                # for manually loading labware in the stacker
                new_labware_ids.append(lw_change.labware_id)
            elif isinstance(lw_change, FlexStackerRetrieveLabware):
                new_labware_ids.remove(lw_change.labware_id)
            elif isinstance(lw_change, FlexStackerStoreLabware):
                # automatically store labware at the bottom of the stack
                new_labware_ids.insert(0, lw_change.labware_id)

        return FlexStackerSubState(
            module_id=self.module_id,
            hopper_labware_ids=new_labware_ids,
            in_static_mode=new_mode,
            pool_primary_definition=pool_primary_definition,
            pool_adapter_definition=pool_adapter_definition,
            pool_lid_definition=pool_lid_definition,
            pool_count=pool_count,
            max_pool_count=max_pool_count,
        )

    def get_pool_definition_ordered_list(self) -> list[LabwareDefinition] | None:
        """Get the pool definitions in a list suitable for getting the height."""
        if not self.pool_primary_definition:
            return None

        defs: list[LabwareDefinition] = []
        if self.pool_lid_definition is not None:
            defs.append(self.pool_lid_definition)
        defs.append(self.pool_primary_definition)
        if self.pool_adapter_definition is not None:
            defs.append(self.pool_adapter_definition)
        return defs
