"""Flex Stacker substate."""
from dataclasses import dataclass
from typing import NewType, List
from opentrons.protocol_engine.state.update_types import (
    FlexStackerStateUpdate,
    FlexStackerAddHopperLabware,
    FlexStackerRemoveHopperLabware,
)


FlexStackerId = NewType("FlexStackerId", str)


@dataclass(frozen=True)
class FlexStackerSubState:
    """Flex Stacker-specific state.

    Provides calculations and read-only state access
    for an individual loaded Flex Stacker Module.
    """

    module_id: FlexStackerId
    hopper_labware_ids: List[str]

    def new_from_state_change(
        self, update: FlexStackerStateUpdate
    ) -> "FlexStackerSubState":
        """Return a new state with the given update applied."""
        lw_change = update.hopper_labware_update
        new_labware_ids = self.hopper_labware_ids.copy()
        if isinstance(lw_change, FlexStackerAddHopperLabware):
            new_labware_ids.append(lw_change.labware_id)
        elif isinstance(lw_change, FlexStackerRemoveHopperLabware):
            new_labware_ids.remove(lw_change.labware_id)

        return FlexStackerSubState(
            module_id=self.module_id,
            hopper_labware_ids=new_labware_ids,
        )
