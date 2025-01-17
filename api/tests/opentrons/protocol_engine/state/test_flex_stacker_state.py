"""Tests for the module state store handling flex stacker state."""
import pytest

from opentrons.protocol_engine.state.modules import ModuleStore, ModuleView
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerSubState,
    FlexStackerId,
)
from opentrons.protocol_engine.state.config import Config

from opentrons.protocol_engine import actions
from opentrons.protocol_engine.types import DeckType, ModuleDefinition
import opentrons.protocol_engine.errors as errors


@pytest.fixture
def ot3_state_config() -> Config:
    """Get a ProtocolEngine state config for the Flex."""
    return Config(
        robot_type="OT-3 Standard",
        deck_type=DeckType.OT3_STANDARD,
    )


@pytest.fixture
def subject(
    ot3_state_config: Config,
) -> ModuleStore:
    """Get a ModuleStore for the flex."""
    return ModuleStore(config=ot3_state_config, deck_fixed_labware=[])


@pytest.fixture
def module_view(subject: ModuleStore) -> ModuleView:
    """Get a ModuleView for the ModuleStore."""
    return ModuleView(state=subject._state)


def test_add_module_action(
    subject: ModuleStore,
    module_view: ModuleView,
    flex_stacker_v1_def: ModuleDefinition,
) -> None:
    """It should create a flex stacker substate."""
    action = actions.AddModuleAction(
        module_id="someModuleId",
        serial_number="someSerialNumber",
        definition=flex_stacker_v1_def,
        module_live_data={"status": "idle", "data": {}},
    )

    with pytest.raises(errors.ModuleNotLoadedError):
        module_view.get_flex_stacker_substate("someModuleId")

    subject.handle_action(action)

    result = module_view.get_flex_stacker_substate("someModuleId")

    assert result == FlexStackerSubState(
        module_id=FlexStackerId("someModuleId"), hopper_labware_ids=[]
    )
