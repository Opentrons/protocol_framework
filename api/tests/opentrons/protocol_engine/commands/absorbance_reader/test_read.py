"""Test absorbance reader initilize command."""
import pytest
from decoy import Decoy
from typing import List

from opentrons.drivers.types import ABSMeasurementMode
from opentrons.hardware_control.modules import AbsorbanceReader

from opentrons.protocol_engine.execution import EquipmentHandler
from opentrons.protocol_engine.resources import FileProvider
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.state import StateView
from opentrons.protocol_engine.state.module_substates import (
    AbsorbanceReaderSubState,
    AbsorbanceReaderId,
)
from opentrons.protocol_engine.commands.command import SuccessData
from opentrons.protocol_engine.commands.absorbance_reader import (
    ReadAbsorbanceResult,
    ReadAbsorbanceParams,
)
from opentrons.protocol_engine.commands.absorbance_reader.read import (
    ReadAbsorbanceImpl,
)


async def test_absorbance_reader_implementation(
    decoy: Decoy,
    state_view: StateView,
    equipment: EquipmentHandler,
    file_provider: FileProvider,
) -> None:
    """It should validate, find hardware module if not virtualized, and disengage."""
    subject = ReadAbsorbanceImpl(
        state_view=state_view, equipment=equipment, file_provider=file_provider
    )

    params = ReadAbsorbanceParams(
        moduleId="unverified-module-id",
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

    decoy.verify(
        await absorbance_module_hw.start_measure(),
        times=1,
    )
    assert result == SuccessData(
        public=ReadAbsorbanceResult(),
        state_update=update_types.StateUpdate(
            module_state_update=update_types.ModuleStateUpdate(
                module_id="unverified-module-id",
                module_type="absorbanceReaderType",
                absorbance_reader_data=update_types.AbsorbanceReaderDataUpdate(),
            )
        ),
    )
