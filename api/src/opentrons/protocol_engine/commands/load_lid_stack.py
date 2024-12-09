"""Load lid stack command request, result, and implementation models."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import TYPE_CHECKING, Optional, Type, List, Dict, Union
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from ..errors import LabwareIsNotAllowedInLocationError
from ..resources import labware_validation, fixture_validation
from ..types import (
    LabwareLocation,
    ModuleLocation,
    ModuleModel,
    OnLabwareLocation,
    DeckSlotLocation,
    AddressableAreaLocation,
)

from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from ..state.update_types import StateUpdate

if TYPE_CHECKING:
    from ..state.state import StateView
    from ..execution import LoadedLabwareData, EquipmentHandler


LoadLidStackCommandType = Literal["loadLidStack"]


class LoadLidStackParams(BaseModel):
    """Payload required to load a lid stack onto a location."""

    location: LabwareLocation = Field(
        ...,
        description="Location the lid stack should be loaded into.",
    )
    loadName: str = Field(
        ...,
        description="Name used to reference a lid labware definition.",
    )
    namespace: str = Field(
        ...,
        description="The namespace the lid labware definition belongs to.",
    )
    version: int = Field(
        ...,
        description="The lid labware definition version.",
    )
    quantity: int = Field(
        ...,
        description="The quantity of lids to load.",
    )


class LoadLidStackResult(BaseModel):
    """Result data from the execution of a LoadLidStack command."""

    labwareIds: List[str] = Field(
        ...,
        description="A list of lid labware IDs to reference the lids in this stack by. The first ID is the bottom of the stack.",
    )
    definition: LabwareDefinition = Field(
        ...,
        description="The full definition data for this lid labware.",
    )
    location: LabwareLocation = Field(
        ..., description="The Location that the stack of lid labware has been loaded."
    )
    offsetIdsByLabwareId: Dict[str, Optional[str]] = Field(
        # Default `None` instead of `...` so this field shows up as non-required in
        # OpenAPI. The server is allowed to omit it or make it null.
        ...,
        description=(
            "An Dictionary of IDs referencing the labware offset that will apply"
            " to the newly-placed lid stack, keyed by Labware ID."
            " This offset will be in effect per lid until a lid is moved"
            " with a `moveLid` command."
            " Null or undefined means no offset applies,"
            " so the default of (0, 0, 0) will be used."
        ),
    )


class LoadLidStackImplementation(
    AbstractCommandImpl[LoadLidStackParams, SuccessData[LoadLidStackResult]]
):
    """Load lid stack command implementation."""

    def __init__(
        self, equipment: EquipmentHandler, state_view: StateView, **kwargs: object
    ) -> None:
        self._equipment = equipment
        self._state_view = state_view

    async def execute(
        self, params: LoadLidStackParams
    ) -> SuccessData[LoadLidStackResult]:
        """Load definition and calibration data necessary for a lid labware."""
        if isinstance(params.location, AddressableAreaLocation):
            area_name = params.location.addressableAreaName
            if not (
                fixture_validation.is_deck_slot(params.location.addressableAreaName)
                or fixture_validation.is_abs_reader(params.location.addressableAreaName)
            ):
                raise LabwareIsNotAllowedInLocationError(
                    f"Cannot load {params.loadName} onto addressable area {area_name}"
                )
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                area_name
            )
        elif isinstance(params.location, DeckSlotLocation):
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                params.location.slotName.id
            )

        verified_location = self._state_view.geometry.ensure_location_not_occupied(
            params.location
        )
        loaded_lid_ids = []
        loaded_lid_offset_id_by_id = {}
        loaded_lid_locations_by_id = {}
        loaded_lid_labwares = []
        state_update = StateUpdate()
        loaded_lid_labwares = await self._equipment.load_lids(
            load_name=params.loadName,
            namespace=params.namespace,
            version=params.version,
            location=verified_location,
            quantity=params.quantity,
            labware_ids=None,
        )
        for i in range(params.quantity):
            loaded_lid_ids.append(loaded_lid_labwares[i].labware_id)
            loaded_lid_offset_id_by_id[
                loaded_lid_labwares[i].labware_id
            ] = loaded_lid_labwares[i].offsetId
            if i == 0:
                loaded_lid_locations_by_id[loaded_lid_ids[i]] = verified_location
            else:
                loaded_lid_locations_by_id[
                    loaded_lid_ids[i]
                ] = loaded_lid_locations_by_id[loaded_lid_ids[i - 1]]

        state_update.set_loaded_lid_stack(
            labware_ids=loaded_lid_ids,
            definition=loaded_lid_labwares[0].definition,
            locations=loaded_lid_locations_by_id,
            offset_ids=loaded_lid_offset_id_by_id,
        )

        if isinstance(verified_location, OnLabwareLocation):
            self._state_view.labware.raise_if_labware_cannot_be_stacked(
                top_labware_definition=loaded_lid_labwares[
                    params.quantity - 1
                ].definition,
                bottom_labware_id=verified_location.labwareId,
            )

        return SuccessData(
            public=LoadLidStackResult(
                labwareIds=loaded_lid_ids,
                definition=loaded_lid_labwares[0].definition,
                location=params.location,
                offsetIdsByLabwareId=loaded_lid_offset_id_by_id,
            ),
            state_update=state_update,
        )


class LoadLidStack(
    BaseCommand[LoadLidStackParams, LoadLidStackResult, ErrorOccurrence]
):
    """Load lid stack command resource model."""

    commandType: LoadLidStackCommandType = "loadLidStack"
    params: LoadLidStackParams
    result: Optional[LoadLidStackResult]

    _ImplementationCls: Type[LoadLidStackImplementation] = LoadLidStackImplementation


class LoadLidStackCreate(BaseCommandCreate[LoadLidStackParams]):
    """Load lid stack command creation request."""

    commandType: LoadLidStackCommandType = "loadLidStack"
    params: LoadLidStackParams

    _CommandCls: Type[LoadLidStack] = LoadLidStack
