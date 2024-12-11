"""Test dispense-in-place commands."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from opentrons.types import Point
from opentrons.protocol_engine.execution import PipettingHandler, GantryMover

from opentrons.protocol_engine.commands.command import SuccessData, DefinedErrorData
from opentrons.protocol_engine.commands.dispense_in_place import (
    DispenseInPlaceParams,
    DispenseInPlaceResult,
    DispenseInPlaceImplementation,
)
from opentrons.protocol_engine.commands.pipetting_common import OverpressureError
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state.state import StateStore
from opentrons.protocol_engine.types import (
    CurrentWell,
    CurrentPipetteLocation,
    CurrentAddressableArea,
)
from opentrons.protocol_engine.state import update_types


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.mark.parametrize(
    "location,stateupdateLabware,stateupdateWell",
    [
        (
            CurrentWell(
                pipette_id="pipette-id-abc",
                labware_id="labware-id-1",
                well_name="well-name-1",
            ),
            "labware-id-1",
            "well-name-1",
        ),
        (None, None, None),
        (CurrentAddressableArea("pipette-id-abc", "addressable-area-1"), None, None),
    ],
)
async def test_dispense_in_place_implementation(
    decoy: Decoy,
    pipetting: PipettingHandler,
    state_store: StateStore,
    gantry_mover: GantryMover,
    model_utils: ModelUtils,
    location: CurrentPipetteLocation | None,
    stateupdateLabware: str,
    stateupdateWell: str,
) -> None:
    """It should dispense in place."""
    subject = DispenseInPlaceImplementation(
        pipetting=pipetting,
        state_view=state_store,
        gantry_mover=gantry_mover,
        model_utils=model_utils,
    )

    data = DispenseInPlaceParams(
        pipetteId="pipette-id-abc",
        volume=123,
        flowRate=456,
    )

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id="pipette-id-abc", volume=123, flow_rate=456, push_out=None
        )
    ).then_return(42)

    decoy.when(state_store.pipettes.get_current_location()).then_return(location)

    result = await subject.execute(data)

    if isinstance(location, CurrentWell):
        assert result == SuccessData(
            public=DispenseInPlaceResult(volume=42),
            state_update=update_types.StateUpdate(
                liquid_operated=update_types.LiquidOperatedUpdate(
                    labware_id=stateupdateLabware,
                    well_name=stateupdateWell,
                    volume_added=42,
                )
            ),
        )
    else:
        assert result == SuccessData(
            public=DispenseInPlaceResult(volume=42),
        )


@pytest.mark.parametrize(
    "location,stateupdateLabware,stateupdateWell",
    [
        (
            CurrentWell(
                pipette_id="pipette-id",
                labware_id="labware-id-1",
                well_name="well-name-1",
            ),
            "labware-id-1",
            "well-name-1",
        ),
        (None, None, None),
        (CurrentAddressableArea("pipette-id", "addressable-area-1"), None, None),
    ],
)
async def test_overpressure_error(
    decoy: Decoy,
    gantry_mover: GantryMover,
    pipetting: PipettingHandler,
    state_store: StateStore,
    model_utils: ModelUtils,
    location: CurrentPipetteLocation | None,
    stateupdateLabware: str,
    stateupdateWell: str,
) -> None:
    """It should return an overpressure error if the hardware API indicates that."""
    subject = DispenseInPlaceImplementation(
        pipetting=pipetting,
        state_view=state_store,
        gantry_mover=gantry_mover,
        model_utils=model_utils,
    )

    pipette_id = "pipette-id"

    position = Point(x=1, y=2, z=3)

    error_id = "error-id"
    error_timestamp = datetime(year=2020, month=1, day=2)

    data = DispenseInPlaceParams(
        pipetteId=pipette_id,
        volume=50,
        flowRate=1.23,
        pushOut=10,
    )

    decoy.when(
        await pipetting.dispense_in_place(
            pipette_id=pipette_id,
            volume=50,
            flow_rate=1.23,
            push_out=10,
        ),
    ).then_raise(PipetteOverpressureError())

    decoy.when(model_utils.generate_id()).then_return(error_id)
    decoy.when(model_utils.get_timestamp()).then_return(error_timestamp)
    decoy.when(await gantry_mover.get_position(pipette_id)).then_return(position)
    decoy.when(state_store.pipettes.get_current_location()).then_return(location)

    result = await subject.execute(data)

    if isinstance(location, CurrentWell):
        assert result == DefinedErrorData(
            public=OverpressureError.construct(
                id=error_id,
                createdAt=error_timestamp,
                wrappedErrors=[matchers.Anything()],
                errorInfo={"retryLocation": (position.x, position.y, position.z)},
            ),
            state_update=update_types.StateUpdate(
                liquid_operated=update_types.LiquidOperatedUpdate(
                    labware_id=stateupdateLabware,
                    well_name=stateupdateWell,
                    volume_added=update_types.CLEAR,
                )
            ),
        )
    else:
        assert result == DefinedErrorData(
            public=OverpressureError.construct(
                id=error_id,
                createdAt=error_timestamp,
                wrappedErrors=[matchers.Anything()],
                errorInfo={"retryLocation": (position.x, position.y, position.z)},
            )
        )
