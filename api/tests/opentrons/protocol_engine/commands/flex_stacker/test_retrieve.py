"""Test Flex Stacker retrieve command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import FlexStacker

from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerSubState,
    FlexStackerId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import flex_stacker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.flex_stacker.retrieve import RetrieveImpl


async def test_retrieve(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should be able to retrieve a labware."""
    subject = RetrieveImpl(state_view=state_view, equipment=equipment)
    data = flex_stacker.RetrieveParams(moduleId="flex-stacker-id")

    fs_module_substate = decoy.mock(cls=FlexStackerSubState)
    fs_hardware = decoy.mock(cls=FlexStacker)

    decoy.when(
        state_view.modules.get_flex_stacker_substate(
            module_id="flex-stacker-id"
        )
    ).then_return(fs_module_substate)

    decoy.when(fs_module_substate.module_id).then_return(
        FlexStackerId("flex-stacker-id")
    )

    decoy.when(
        equipment.get_module_hardware_api(FlexStackerId("flex-stacker-id"))
    ).then_return(fs_hardware)

    result = await subject.execute(data)
    decoy.verify(await fs_hardware.dispense_labware(labware_height=50.0), times=1)
    assert result == SuccessData(
        public=flex_stacker.RetrieveResult(),
    )
