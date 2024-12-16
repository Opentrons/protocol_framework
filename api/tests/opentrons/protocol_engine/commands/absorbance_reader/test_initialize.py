"""Test absorbance reader initilize command."""
from decoy import Decoy

from opentrons.hardware_control.modules import AbsorbanceReader

from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    AbsorbanceReaderSubState,
    AbsorbanceReaderId,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.absorbance_reader import (
    InitializeParams,
    InitializeResult,
)
from opentrons.protocol_engine.commands.absorbance_reader.initialize import (
    InitializeImpl,
)


async def test_absorbance_reader_implementation(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
) -> None:
    """It should validate, find hardware module if not virtualized, and disengage."""
    subject = InitializeImpl(state_view=state_view, equipment=equipment)

    params = InitializeParams(
        moduleId="unverified-module-id", measureMode="single", sampleWavelengths=[1, 2]
    )

    mabsorbance_module_substate = decoy.mock(cls=AbsorbanceReaderSubState)
    absorbance_module_hw = decoy.mock(cls=AbsorbanceReader)
    verified_module_id = AbsorbanceReaderId("module-id")

    decoy.when(
        state_view.modules.get_absorbance_reader_substate("unverified-module-id")
    ).then_return(mabsorbance_module_substate)

    decoy.when(mabsorbance_module_substate.module_id).then_return(verified_module_id)

    decoy.when(equipment.get_module_hardware_api(verified_module_id)).then_return(
        absorbance_module_hw
    )

    result = await subject.execute(params=params)

    decoy.verify(await absorbance_module_hw.set_sample_wavelength(), times=1)
    assert result == SuccessData(public=InitializeResult())
