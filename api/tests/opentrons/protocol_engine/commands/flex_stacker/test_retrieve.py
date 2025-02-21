"""Test Flex Stacker retrieve command implementation."""

import pytest
from decoy import Decoy
from contextlib import nullcontext as does_not_raise
from typing import ContextManager, Any

from opentrons.calibration_storage.helpers import uri_from_details
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
    LoadedLabware,
    LoadedModule,
    OverlapOffset,
    OnModuleLocationSequenceComponent,
    OnAddressableAreaLocationSequenceComponent,
    InStackerHopperLocation,
    OnCutoutFixtureLocationSequenceComponent,
)
from opentrons.protocol_engine.errors import CannotPerformModuleAction
from opentrons.types import DeckSlotName
from opentrons.protocol_engine.execution import LoadedLabwareData

from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters,
    Metadata,
)


@pytest.mark.parametrize(
    "in_static_mode,expectation",
    [
        (
            True,
            pytest.raises(
                CannotPerformModuleAction,
                match="Cannot retrieve labware from Flex Stacker while in static mode",
            ),
        ),
        (False, does_not_raise()),
    ],
)
async def test_retrieve(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    in_static_mode: bool,
    expectation: ContextManager[Any],
    tiprack_lid_def: LabwareDefinition,
) -> None:
    """It should be able to retrieve a labware."""
    subject = RetrieveImpl(state_view=state_view, equipment=equipment)
    data = flex_stacker.RetrieveParams(
        moduleId="flex-stacker-id", namespace="opentrons", version=1
    )
    labware_def = LabwareDefinition.model_construct(  # type: ignore[call-arg]
        parameters=Parameters.model_construct(loadName="tiprack"),  # type: ignore[call-arg]
        namespace="world",
        version=123,
        metadata=Metadata.model_construct(displayName="tiprack"),  # type: ignore[call-arg]
    )

    fs_module_substate = FlexStackerSubState(
        module_id=FlexStackerId("flex-stacker-id"),
        in_static_mode=in_static_mode,
        hopper_labware_ids=["labware-id"],
        pool_primary_definition=labware_def,
        pool_adapter_definition=None,
        pool_lid_definition=None,
        pool_count=1,
    )
    fs_hardware = decoy.mock(cls=FlexStacker)
    decoy.when(
        state_view.modules.get_flex_stacker_substate(module_id="flex-stacker-id")
    ).then_return(fs_module_substate)

    decoy.when(
        await equipment.load_labware(
            "tiprack",
            "opentrons",
            1,
            ModuleLocation(moduleId="flex-stacker-id"),
            None,
        )
    ).then_return(LoadedLabwareData("labware-id", labware_def, None))
    decoy.when(state_view.modules.get_location("flex-stacker-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName(value="B3")),
    )
    decoy.when(state_view.modules.get("flex-stacker-id")).then_return(
        LoadedModule(
            id="flex-stacker-id",
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

    decoy.when(state_view.labware.get("labware-id")).then_return(
        LoadedLabware(
            id="labware-id",
            loadName="tiprack",
            definitionUri=uri_from_details(namespace="a", load_name="b", version=1),
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_3),
            offsetId=None,
            lid_id="lid-id",
            displayName="Labware",
        )
    )

    decoy.when(state_view.labware.get_dimensions(labware_id="labware-id")).then_return(
        Dimensions(x=1, y=1, z=1)
    )

    decoy.when(state_view.labware.get_definition("lid-id")).then_return(tiprack_lid_def)

    decoy.when(
        state_view.labware.get_labware_overlap_offsets(tiprack_lid_def, "tiprack")
    ).then_return(OverlapOffset(x=0, y=0, z=14))

    decoy.when(
        equipment.get_module_hardware_api(FlexStackerId("flex-stacker-id"))
    ).then_return(fs_hardware)
    decoy.when(state_view.geometry.get_location_sequence("labware-id")).then_return(
        [
            InStackerHopperLocation(moduleId="flex-stacker-id"),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutB4", possibleCutoutFixtureIds=["flexStackerModuleV1"]
            ),
        ]
    )
    decoy.when(
        state_view.geometry.get_predicted_location_sequence(
            ModuleLocation(moduleId="flex-stacker-id")
        )
    ).then_return(
        [
            OnAddressableAreaLocationSequenceComponent(
                addressableAreaName="flexStackerV1B4"
            ),
            OnModuleLocationSequenceComponent(moduleId="flex-stacker-id"),
            OnCutoutFixtureLocationSequenceComponent(
                cutoutId="cutoutB3", possibleCutoutFixtureIds=["flexStackerModuleV1"]
            ),
        ]
    )

    decoy.when(
        state_view.geometry.get_height_of_labware_stack(definitions=[labware_def])
    ).then_return(4)

    with expectation:
        result = await subject.execute(data)

    if not in_static_mode:
        decoy.verify(await fs_hardware.dispense_labware(labware_height=4), times=1)

        result == SuccessData(
            public=flex_stacker.RetrieveResult(
                labwareId="labware-id",
                primaryLocationSequence=[
                    OnAddressableAreaLocationSequenceComponent(
                        addressableAreaName="flexStackerV1B4",
                    ),
                    OnModuleLocationSequenceComponent(moduleId="flex-stacker-id"),
                    OnCutoutFixtureLocationSequenceComponent(
                        cutoutId="cutoutB3",
                        possibleCutoutFixtureIds=["flexStackerModuleV1"],
                    ),
                ],
                primaryLabwareURI="fancy_uri",
            ),
            state_update=StateUpdate(
                batch_loaded_labware=BatchLoadedLabwareUpdate(
                    new_locations_by_id={
                        "labware-id": ModuleLocation(moduleId="flex-stacker-id")
                    },
                    offset_ids_by_id={"labware-id": None},
                    display_names_by_id={"labware-id": "tiprack"},
                    definitions_by_id={"labware-id": labware_def},
                ),
                flex_stacker_state_update=FlexStackerStateUpdate(
                    module_id="flex-stacker-id",
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

        # raise ValueError(f"result: {result}                                     success: {test}")
