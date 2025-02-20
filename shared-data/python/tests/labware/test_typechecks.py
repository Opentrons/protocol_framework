"""Test that our bindings can validate and parse our standard labware definitions."""


import pytest
import typeguard
import pydantic

from opentrons_shared_data.labware import load_definition
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition as PydanticLabwareDefinition,
)
from opentrons_shared_data.labware.types import (
    LabwareDefinition as TypedDictLabwareDefinition,
    LabwareDefinition2 as TypedDictLabwareDefinition2,
    LabwareDefinition3 as TypedDictLabwareDefinition3,
)


from . import get_ot_defs


@pytest.mark.parametrize("loadname,version", get_ot_defs(schema=2))
def test_schema_2_types(loadname: str, version: int) -> None:
    defdict = load_definition(loadname, version, schema=2)

    typeguard.check_type(defdict, TypedDictLabwareDefinition2)
    typeguard.check_type(defdict, TypedDictLabwareDefinition)
    PydanticLabwareDefinition.model_validate(defdict)


@pytest.mark.parametrize("loadname,version", get_ot_defs(schema=3))
def test_schema_3_types(loadname: str, version: int) -> None:
    defdict = load_definition(loadname, version, schema=3)

    typeguard.check_type(defdict, TypedDictLabwareDefinition3)
    typeguard.check_type(defdict, TypedDictLabwareDefinition)
    PydanticLabwareDefinition.model_validate(defdict)


def test_loadname_regex_applied() -> None:
    defdict = load_definition(*get_ot_defs(schema=2)[0])
    defdict["parameters"]["loadName"] = "ALSJHDAKJLA"
    with pytest.raises(pydantic.ValidationError):
        PydanticLabwareDefinition.model_validate(defdict)


def test_namespace_regex_applied() -> None:
    defdict = load_definition(*get_ot_defs(schema=2)[0])
    defdict["namespace"] = "ALSJHDAKJLA"
    with pytest.raises(pydantic.ValidationError):
        PydanticLabwareDefinition.model_validate(defdict)
