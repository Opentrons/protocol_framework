"""Test Flex Stacker retrieve command implementation."""
from decoy import Decoy

from opentrons.hardware_control.modules import FlexStacker

from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    StateUpdate,
    FlexStackerStateUpdate,
    FlexStackerRetrieveLabware,
    LabwareLocationUpdate,
)
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerSubState,
    FlexStackerId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import flex_stacker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.flex_stacker.retrieve import RetrieveImpl
from opentrons.protocol_engine.types import Dimensions, ModuleLocation


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
        state_view.modules.get_flex_stacker_substate(module_id="flex-stacker-id")
    ).then_return(fs_module_substate)

    decoy.when(fs_module_substate.module_id).then_return(
        FlexStackerId("flex-stacker-id")
    )
    decoy.when(fs_module_substate.hopper_labware_ids).then_return(["labware-id"])
    decoy.when(state_view.labware.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=1, y=1, z=1)
    )

    decoy.when(
        equipment.get_module_hardware_api(FlexStackerId("flex-stacker-id"))
    ).then_return(fs_hardware)

    result = await subject.execute(data)
    decoy.verify(await fs_hardware.dispense_labware(labware_height=1), times=1)

    assert result == SuccessData(
        public=flex_stacker.RetrieveResult(labware_id="labware-id"),
        state_update=StateUpdate(
            labware_location=LabwareLocationUpdate(
                labware_id="labware-id",
                new_location=ModuleLocation(moduleId="flex-stacker-id"),
                offset_id=None,
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id="flex-stacker-id",
                hopper_labware_update=FlexStackerRetrieveLabware(
                    labware_id="labware-id"
                ),
            ),
        ),
    )
