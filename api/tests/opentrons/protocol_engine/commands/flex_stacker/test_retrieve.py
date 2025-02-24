"""Test Flex Stacker retrieve command implementation."""

import pytest
from decoy import Decoy

from opentrons.hardware_control.modules import FlexStacker

from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.update_types import (
    StateUpdate,
    FlexStackerStateUpdate,
    FlexStackerRetrieveLabware,
    BatchLoadedLabwareUpdate,
    AddressableAreaUsedUpdate,
)
from opentrons.protocol_engine.state.module_substates import (
    FlexStackerSubState,
    FlexStackerId,
)
from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.commands import flex_stacker
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.flex_stacker.retrieve import RetrieveImpl
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    Dimensions,
    ModuleLocation,
    ModuleModel,
    LoadedModule,
    OverlapOffset,
    OnModuleLocationSequenceComponent,
    OnAddressableAreaLocationSequenceComponent,
    OnCutoutFixtureLocationSequenceComponent,
    LabwareLocationSequence,
)
from opentrons.protocol_engine.errors import CannotPerformModuleAction
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.execution import LoadedLabwareData

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
)


async def test_retrieve_raises_when_static(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should raise an exception when called in static mode."""
    subject = RetrieveImpl(state_view=state_view, equipment=equipment)
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        in_static_mode=True,
        hopper_labware_ids=[],
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        pool_count=1,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        await equipment.load_labware(
            "tiprack",
            "opentrons",
            1,
            ModuleLocation(moduleId=stacker_id),
            None,
        )
    ).then_return(LoadedLabwareData("labware-id", flex_50uL_tiprack, None))

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id)
        )
    ).then_return(
        [
            OnAddressableAreaLocationSequenceComponent(
                addressableAreaName="flexStackerV1B4"
            ),
            OnModuleLocationSequenceComponent(moduleId=stacker_id),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutB3", possibleCutoutFixtureIds=["flexStackerModuleV1"]
            ),
        ]
    )

    decoy.when(
        state_view.geometry.get_height_of_labware_stack(definitions=[flex_50uL_tiprack])
    ).then_return(4)

    with pytest.raises(
        CannotPerformModuleAction,
        match="Cannot retrieve labware from Flex Stacker while in static mode",
    ):
        await subject.execute(data)


def _prep_stacker_own_location(
    decoy: Decoy, state_view: StateView, stacker_id: str
) -> None:
    decoy.when(state_view.modules.get_location(stacker_id)).then_return(
        DeckSlotLocation(slotName=DeckSlotName(value="B3")),
    )
    decoy.when(state_view.modules.get(stacker_id)).then_return(
        LoadedModule(
            id=stacker_id,
            location=DeckSlotLocation(slotName=DeckSlotName(value="B3")),
            model=ModuleModel.FLEX_STACKER_MODULE_V1,
            serialNumber="HIIIII",
        )
    )
    decoy.when(
        state_view.modules.ensure_and_convert_module_fixture_location(
            deck_slot=DeckSlotName("B3"), model=ModuleModel.FLEX_STACKER_MODULE_V1
        )
    ).then_return("flexStackerV1B4")


def _stacker_base_loc_seq(stacker_id: str) -> LabwareLocationSequence:
    return [
        OnAddressableAreaLocationSequenceComponent(
            addressableAreaName="flexStackerV1B4"
        ),
        OnModuleLocationSequenceComponent(moduleId=stacker_id),
        OnCutoutFixtureLocationSequenceComponent(
            cutoutId="cutoutB3", possibleCutoutFixtureIds=["flexStackerModuleV1"]
        ),
    ]


async def test_retrieve_primary_only(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    flex_50uL_tiprack: LabwareDefinition,
    stacker_id: FlexStackerId,
    stacker_hardware: FlexStacker,
) -> None:
    """It should be able to retrieve a labware."""
    subject = RetrieveImpl(state_view=state_view, equipment=equipment)
    data = flex_stacker.RetrieveParams(moduleId=stacker_id)

    fs_module_substate = FlexStackerSubState(
        module_id=stacker_id,
        in_static_mode=False,
        hopper_labware_ids=[],
        pool_primary_definition=flex_50uL_tiprack,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        pool_count=1,
    )
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id=stacker_id)
    ).then_return(fs_module_substate)

    decoy.when(
        await equipment.load_labware_from_definition(
            definition=flex_50uL_tiprack,
            location=ModuleLocation(moduleId=stacker_id),
            labware_id=None,
        )
    ).then_return(LoadedLabwareData("labware-id", flex_50uL_tiprack, None))

    decoy.when(state_view.labware.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=1, y=1, z=1)
    )

    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId=stacker_id)
        )
    ).then_return(_stacker_base_loc_seq(stacker_id))

    decoy.when(
        state_view.geometry.get_height_of_labware_stack(definitions=[flex_50uL_tiprack])
    ).then_return(4)

    _prep_stacker_own_location(decoy, state_view, stacker_id)

    result = await subject.execute(data)

    decoy.verify(await stacker_hardware.dispense_labware(labware_height=4), times=1)
    _ = OverlapOffset(x=0, y=1, z=2)

    result == SuccessData(
        public=flex_stacker.RetrieveResult(
            labwareId="labware-id",
            primaryLocationSequence=_stacker_base_loc_seq(stacker_id),
            primaryLabwareURI="fancy_uri",
        ),
        state_update=StateUpdate(
            batch_loaded_labware=BatchLoadedLabwareUpdate(
                new_locations_by_id={"labware-id": ModuleLocation(moduleId=stacker_id)},
                offset_ids_by_id={"labware-id": None},
                display_names_by_id={"labware-id": "tiprack"},
                definitions_by_id={"labware-id": flex_50uL_tiprack},
            ),
            flex_stacker_state_update=FlexStackerStateUpdate(
                module_id=stacker_id,
                hopper_labware_update=FlexStackerRetrieveLabware(
                    labware_id="labware-id"
                ),
                pool_count=0,
            ),
            addressable_area_used=AddressableAreaUsedUpdate(
                addressable_area_name="flexStackerV1B4"
            ),
        ),
    )
