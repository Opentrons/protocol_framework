"""Test get next tip in place commands."""
from decoy import Decoy

from opentrons.protocol_engine import StateView
from opentrons.protocol_engine.types import NextTipInfo
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.get_next_tip import (
    GetNextTipParams,
    GetNextTipResult,
    GetNextTipImplementation,
)

from opentrons.hardware_control.nozzle_manager import NozzleMap


async def test_get_next_tip_implementation_full(
    decoy: Decoy,
    state_view: StateView,
) -> None:
    """A GetNextTip command should have an execution implementation."""
    subject = GetNextTipImplementation(state_view=state_view)
    params = GetNextTipParams(
        pipetteId="abc", labwareIds=["123", "456"], startingWellName="xyz"
    )

    decoy.when(state_view.tips.get_pipette_active_channels("abc")).then_return(42)
    decoy.when(state_view.tips.get_pipette_channels("abc")).then_return(42)

    decoy.when(
        state_view.tips.get_next_tip(
            labware_id="456", num_tips=42, starting_tip_name="xyz", nozzle_map=None
        )
    ).then_return("foo")

    result = await subject.execute(params)

    assert result == SuccessData(
        public=GetNextTipResult(
            nextTipInfo=NextTipInfo(labwareId="456", wellName="foo")
        ),
    )


async def test_get_next_tip_implementation_partial(
    decoy: Decoy,
    state_view: StateView,
) -> None:
    """A GetNextTip command should have an execution implementation."""
    subject = GetNextTipImplementation(state_view=state_view)
    params = GetNextTipParams(
        pipetteId="abc", labwareIds=["123", "456"], startingWellName="xyz"
    )
    mock_nozzle_map = decoy.mock(cls=NozzleMap)

    decoy.when(state_view.tips.get_pipette_active_channels("abc")).then_return(24)
    decoy.when(state_view.tips.get_pipette_channels("abc")).then_return(42)
    decoy.when(state_view.tips.get_pipette_nozzle_map("abc")).then_return(
        mock_nozzle_map
    )

    decoy.when(
        state_view.tips.get_next_tip(
            labware_id="456",
            num_tips=24,
            starting_tip_name="xyz",
            nozzle_map=mock_nozzle_map,
        )
    ).then_return("foo")

    result = await subject.execute(params)

    assert result == SuccessData(
        public=GetNextTipResult(
            nextTipInfo=NextTipInfo(labwareId="456", wellName="foo")
        ),
    )


async def test_get_next_tip_implementation_no_tips(
    decoy: Decoy,
    state_view: StateView,
) -> None:
    """A GetNextTip command should have an execution implementation."""
    subject = GetNextTipImplementation(state_view=state_view)
    params = GetNextTipParams(
        pipetteId="abc", labwareIds=["123", "456"], startingWellName="xyz"
    )

    decoy.when(state_view.tips.get_pipette_active_channels("abc")).then_return(42)
    decoy.when(state_view.tips.get_pipette_channels("abc")).then_return(42)

    result = await subject.execute(params)

    assert result == SuccessData(
        public=GetNextTipResult(nextTipInfo=None),
    )
