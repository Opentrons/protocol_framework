"""Liquid view tests."""
import frozendict
import pytest

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    LiquidClassSchemaV1,
)
from opentrons.protocol_engine.state.liquid_classes import (
    LiquidClassState,
    LiquidClassView,
)
from opentrons.protocol_engine.types import LiquidClassRecord


@pytest.fixture
def liquid_class_record(
    minimal_liquid_class_def2: LiquidClassSchemaV1,
) -> LiquidClassRecord:
    """An example LiquidClassRecord for tests."""
    pipette_0 = minimal_liquid_class_def2.byPipette[0]
    by_tip_type_0 = pipette_0.byTipType[0]
    return LiquidClassRecord(
        liquidClassName=minimal_liquid_class_def2.liquidClassName,
        pipetteModel=pipette_0.pipetteModel,
        tiprack=by_tip_type_0.tiprack,
        aspirate=by_tip_type_0.aspirate,
        singleDispense=by_tip_type_0.singleDispense,
        multiDispense=by_tip_type_0.multiDispense,
    )


@pytest.fixture
def subject(liquid_class_record: LiquidClassRecord) -> LiquidClassView:
    """The LiquidClassView test subject."""
    frozen_liquid_class_record = frozendict.deepfreeze(liquid_class_record.dict())

    state = LiquidClassState(
        liquid_class_record_by_id={"liquid-class-id": liquid_class_record},
        frozen_liquid_class_record_to_id={
            frozen_liquid_class_record: "liquid-class-id"
        },
    )
    return LiquidClassView(state)


def test_get_by_id(
    subject: LiquidClassView, liquid_class_record: LiquidClassRecord
) -> None:
    """Should look up LiquidClassRecord by ID."""
    assert subject.get_by_id("liquid-class-id") == liquid_class_record


def test_get_by_frozen_liquid_class_record(
    subject: LiquidClassView, liquid_class_record: LiquidClassRecord
) -> None:
    """Should look up existing ID given a LiquidClassRecord."""
    assert (
        subject.get_id_for_liquid_class_record(liquid_class_record) == "liquid-class-id"
    )


def test_get_all(
    subject: LiquidClassView, liquid_class_record: LiquidClassRecord
) -> None:
    """Should get all LiquidClassRecords in the store."""
    assert subject.get_all() == frozendict.frozendict(
        {"liquid-class-id": liquid_class_record}
    )
