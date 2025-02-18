"""Test that our `TypedDict`-based bindings can hold our standard labware definitions."""


import pytest
import typeguard

from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.types import (
    LabwareDefinition,
    LabwareDefinition2,
    LabwareDefinition3,
)

from . import get_ot_defs


@pytest.mark.parametrize("loadname,version", get_ot_defs(schema=2))
def test_schema_2_types(loadname: str, version: int) -> None:
    defdict = load_definition(loadname, version, schema=2)

    typeguard.check_type(defdict, LabwareDefinition2)
    typeguard.check_type(defdict, LabwareDefinition)


@pytest.mark.parametrize("loadname,version", get_ot_defs(schema=3))
def test_schema_3_types(loadname: str, version: int) -> None:
    defdict = load_definition(loadname, version, schema=3)

    typeguard.check_type(defdict, LabwareDefinition3)
    typeguard.check_type(defdict, LabwareDefinition)
