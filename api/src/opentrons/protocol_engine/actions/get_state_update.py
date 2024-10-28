# noqa: D100
from __future__ import annotations
from typing import TYPE_CHECKING

from .actions import Action, SucceedCommandAction, FailCommandAction
from ..commands.command import DefinedErrorData

if TYPE_CHECKING:
    from ..state.update_types import StateUpdate


def get_state_update(action: Action) -> StateUpdate | None:
    """Extract the StateUpdate from an action, if there is one."""
    if isinstance(action, SucceedCommandAction):
        return action.state_update
    elif isinstance(action, FailCommandAction) and isinstance(
        action.error, DefinedErrorData
    ):
        return action.error.state_update
    else:
        return None
