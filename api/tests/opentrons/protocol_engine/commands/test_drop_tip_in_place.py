"""Test drop tip in place commands."""
from datetime import datetime

import pytest
from decoy import Decoy, matchers

from opentrons.protocol_engine.commands.pipetting_common import (
    TipPhysicallyAttachedError,
    MustHomeError as Defined_MustHomeError,
)
from opentrons.protocol_engine.commands.command import DefinedErrorData, SuccessData
from opentrons.protocol_engine.commands.drop_tip_in_place import (
    DropTipInPlaceParams,
    DropTipInPlaceResult,
    DropTipInPlaceImplementation,
)
from opentrons.protocol_engine.errors.exceptions import TipAttachedError, MustHomeError
from opentrons.protocol_engine.execution import TipHandler, GantryMover
from opentrons.protocol_engine.resources.model_utils import ModelUtils
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.update_types import (
    PipetteTipStateUpdate,
    StateUpdate,
)
from opentrons.types import Point


@pytest.fixture
def mock_tip_handler(decoy: Decoy) -> TipHandler:
    """Get a mock TipHandler."""
    return decoy.mock(cls=TipHandler)


@pytest.fixture
def mock_model_utils(decoy: Decoy) -> ModelUtils:
    """Get a mock ModelUtils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def mock_gantry_mover(decoy: Decoy) -> GantryMover:
    """Get a mock GantryMover."""
    return decoy.mock(cls=GantryMover)


async def test_success(
    decoy: Decoy,
    mock_tip_handler: TipHandler,
    mock_model_utils: ModelUtils,
    mock_gantry_mover: GantryMover,
) -> None:
    """A DropTip command should have an execution implementation."""
    subject = DropTipInPlaceImplementation(
        tip_handler=mock_tip_handler,
        model_utils=mock_model_utils,
        gantry_mover=mock_gantry_mover,
    )
    params = DropTipInPlaceParams(pipetteId="abc", homeAfter=False)

    result = await subject.execute(params)

    assert result == SuccessData(
        public=DropTipInPlaceResult(),
        state_update=StateUpdate(
            pipette_tip_state=PipetteTipStateUpdate(pipette_id="abc", tip_geometry=None)
        ),
    )

    decoy.verify(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=False),
        times=1,
    )


async def test_tip_attached_error(
    decoy: Decoy,
    mock_tip_handler: TipHandler,
    mock_model_utils: ModelUtils,
    mock_gantry_mover: GantryMover,
) -> None:
    """Should handle a tip not attached error."""
    subject = DropTipInPlaceImplementation(
        tip_handler=mock_tip_handler,
        model_utils=mock_model_utils,
        gantry_mover=mock_gantry_mover,
    )

    params = DropTipInPlaceParams(pipetteId="abc", homeAfter=False)

    decoy.when(await mock_gantry_mover.get_position(pipette_id="abc")).then_return(
        Point(9, 8, 7)
    )
    decoy.when(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=False)
    ).then_raise(TipAttachedError("Egads!"))

    decoy.when(mock_model_utils.generate_id()).then_return("error-id")
    decoy.when(mock_model_utils.get_timestamp()).then_return(
        datetime(year=1, month=2, day=3)
    )

    result = await subject.execute(params)

    assert result == DefinedErrorData(
        public=TipPhysicallyAttachedError.construct(
            id="error-id",
            createdAt=datetime(year=1, month=2, day=3),
            wrappedErrors=[matchers.Anything()],
            errorInfo={"retryLocation": (9, 8, 7)},
        ),
        state_update=StateUpdate(),
        state_update_if_false_positive=StateUpdate(
            pipette_tip_state=PipetteTipStateUpdate(pipette_id="abc", tip_geometry=None)
        ),
    )


async def test_must_home_error(
    decoy: Decoy,
    mock_tip_handler: TipHandler,
    mock_model_utils: ModelUtils,
    mock_gantry_mover: GantryMover,
) -> None:
    """Should handle a must home error."""
    subject = DropTipInPlaceImplementation(
        tip_handler=mock_tip_handler,
        model_utils=mock_model_utils,
        gantry_mover=mock_gantry_mover,
    )

    params = DropTipInPlaceParams(pipetteId="abc", homeAfter=False)

    decoy.when(await mock_gantry_mover.get_position(pipette_id="abc")).then_return(
        Point(9, 8, 7)
    )
    decoy.when(
        await mock_tip_handler.drop_tip(pipette_id="abc", home_after=False)
    ).then_raise(MustHomeError("Egads!"))

    decoy.when(mock_model_utils.generate_id()).then_return("error-id")
    decoy.when(mock_model_utils.get_timestamp()).then_return(
        datetime(year=1, month=2, day=3)
    )

    result = await subject.execute(params)
    state_update_false_positive = StateUpdate(pipette_location=update_types.CLEAR)
    assert result == DefinedErrorData(
        public=Defined_MustHomeError.construct(
            id="error-id",
            createdAt=datetime(year=1, month=2, day=3),
            wrappedErrors=[matchers.Anything()],
        ),
        state_update=StateUpdate(),
        state_update_if_false_positive=state_update_false_positive,
    )
