"""A data store of liquid classes."""

from __future__ import annotations

import dataclasses
from typing import Any, Dict

import frozendict
from typing_extensions import Optional

from ._abstract_store import HandlesActions, HasState
from ..actions import Action
from ..actions.actions import AddLiquidClassAction
from ..types import LiquidClassRecord


@dataclasses.dataclass
class LiquidClassState:
    """Our state is a bidirectional mapping between IDs <-> LiquidClassRecords."""

    # We use the bidirectional map to see if we've already assigned an ID to a liquid class when the
    # engine is asked to store a new liquid class.
    liquid_class_record_by_id: Dict[str, LiquidClassRecord]
    frozen_liquid_class_record_to_id: Dict[frozendict.frozendict[str, Any], str]
    # We can't use the LiquidClassRecord directly as a lookup key because it contains lots of fields
    # that are unhashable. That's why we have to convert it to a frozendict instead.


class LiquidClassStore(HasState[LiquidClassState], HandlesActions):
    """Container for LiquidClassState."""

    _state: LiquidClassState

    def __init__(self) -> None:
        self._state = LiquidClassState(
            liquid_class_record_by_id={},
            frozen_liquid_class_record_to_id={},
        )

    def handle_action(self, action: Action) -> None:
        """Update the state in response to the action."""
        if isinstance(action, AddLiquidClassAction):
            # We're just a data store. All the validation and ID generation happens in the command implementation.
            self._state.liquid_class_record_by_id[
                action.liquid_class_id
            ] = action.liquid_class_record

            frozen_liquid_class_record = frozendict.deepfreeze(
                action.liquid_class_record.dict()
            )
            self._state.frozen_liquid_class_record_to_id[
                frozen_liquid_class_record
            ] = action.liquid_class_id


class LiquidClassView(HasState[LiquidClassState]):
    """Read-only view of the LiquidClassState."""

    _state: LiquidClassState

    def __init__(self, state: LiquidClassState) -> None:
        self._state = state

    def get_by_id(self, liquid_class_id: str) -> LiquidClassRecord:
        """Get the LiquidClassRecord with the given identifier."""
        return self._state.liquid_class_record_by_id[liquid_class_id]

    def get_id_for_liquid_class_record(
        self, liquid_class_record: LiquidClassRecord
    ) -> Optional[str]:
        """See if the given LiquidClassRecord if already in the store, and if so, return its identifier."""
        frozen_liquid_class_record = frozendict.deepfreeze(liquid_class_record.dict())
        return self._state.frozen_liquid_class_record_to_id.get(
            frozen_liquid_class_record
        )

    def get_all(self) -> frozendict.frozendict[str, LiquidClassRecord]:
        """Get all the LiquidClassRecords in the store."""
        return frozendict.frozendict(self._state.liquid_class_record_by_id)
