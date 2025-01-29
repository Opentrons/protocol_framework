# noqa: D100

from datetime import datetime, timezone

import pytest
import sqlalchemy

from opentrons.protocol_engine import (
    LabwareOffsetVector,
    OnLabwareOffsetLocationSequenceComponent,
    OnModuleOffsetLocationSequenceComponent,
    OnAddressableAreaOffsetLocationSequenceComponent,
)
from opentrons.protocol_engine.types import ModuleModel

from robot_server.labware_offsets.store import (
    LabwareOffsetStore,
    LabwareOffsetNotFoundError,
)
from robot_server.labware_offsets.models import StoredLabwareOffset


@pytest.fixture
def subject(sql_engine: sqlalchemy.engine.Engine) -> LabwareOffsetStore:
    """Return a test subject."""
    return LabwareOffsetStore(sql_engine)


def _get_all(store: LabwareOffsetStore) -> list[StoredLabwareOffset]:
    return store.search()


def test_filter_fields(subject: LabwareOffsetStore) -> None:
    """Test each filterable field to make sure it returns only matching entries."""
    offset_a = StoredLabwareOffset(
        id="a",
        createdAt=datetime.now(timezone.utc),
        definitionUri="definitionUri a",
        locationSequence=[
            OnLabwareOffsetLocationSequenceComponent(
                labwareUri="location.definitionUri a"
            ),
            OnModuleOffsetLocationSequenceComponent(
                moduleModel=ModuleModel.THERMOCYCLER_MODULE_V1
            ),
            OnAddressableAreaOffsetLocationSequenceComponent(addressableAreaName="A1"),
        ],
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    offset_b = StoredLabwareOffset(
        id="b",
        createdAt=datetime.now(timezone.utc),
        definitionUri="definitionUri b",
        locationSequence=[
            OnLabwareOffsetLocationSequenceComponent(
                labwareUri="location.definitionUri b"
            ),
            OnModuleOffsetLocationSequenceComponent(
                moduleModel=ModuleModel.MAGNETIC_BLOCK_V1
            ),
            OnAddressableAreaOffsetLocationSequenceComponent(addressableAreaName="B1"),
        ],
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    subject.add(offset_a)
    subject.add(offset_b)

    assert subject.search(id_filter=offset_a.id) == [offset_a]
    assert subject.search(id_filter=offset_b.id) == [offset_b]

    assert subject.search(definition_uri_filter=offset_a.definitionUri) == [offset_a]
    assert subject.search(definition_uri_filter=offset_b.definitionUri) == [offset_b]

    assert subject.search(location_addressable_area_filter="A1") == [offset_a]
    assert subject.search(location_addressable_area_filter="B1") == [offset_b]

    assert subject.search(
        location_module_model_filter=ModuleModel.THERMOCYCLER_MODULE_V1
    ) == [offset_a]
    assert subject.search(
        location_module_model_filter=ModuleModel.MAGNETIC_BLOCK_V1
    ) == [offset_b]

    assert subject.search(
        location_definition_uri_filter="location.definitionUri a"
    ) == [offset_a]
    assert subject.search(
        location_definition_uri_filter="location.definitionUri b"
    ) == [offset_b]


def test_filter_combinations(subject: LabwareOffsetStore) -> None:
    """Test that multiple filters are combined correctly."""
    ids_and_definition_uris = [
        ("id-1", "definition-uri-a"),
        ("id-2", "definition-uri-b"),
        ("id-3", "definition-uri-a"),
        ("id-4", "definition-uri-b"),
        ("id-5", "definition-uri-a"),
        ("id-6", "definition-uri-b"),
    ]
    labware_offsets = [
        StoredLabwareOffset(
            id=id,
            createdAt=datetime.now(timezone.utc),
            definitionUri=definition_uri,
            locationSequence=[
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="A1"
                )
            ],
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
        for (id, definition_uri) in ids_and_definition_uris
    ]

    for labware_offset in labware_offsets:
        subject.add(labware_offset)

    # No filters:
    assert subject.search() == labware_offsets

    # Filter on one thing:
    result = subject.search(definition_uri_filter="definition-uri-b")
    assert len(result) == 3
    assert result == [
        entry for entry in labware_offsets if entry.definitionUri == "definition-uri-b"
    ]

    # Filter on two things:
    result = subject.search(
        id_filter="id-2",
        definition_uri_filter="definition-uri-b",
    )
    assert result == [labware_offsets[1]]

    # Filters should be ANDed, not ORed, together:
    result = subject.search(
        id_filter="id-1",
        definition_uri_filter="definition-uri-b",
    )
    assert result == []


def test_delete(subject: LabwareOffsetStore) -> None:
    """Test the `delete()` and `delete_all()` methods."""
    a, b, c = [
        StoredLabwareOffset(
            id=id,
            createdAt=datetime.now(timezone.utc),
            definitionUri="",
            locationSequence=[
                OnAddressableAreaOffsetLocationSequenceComponent(
                    addressableAreaName="A1"
                )
            ],
            vector=LabwareOffsetVector(x=1, y=2, z=3),
        )
        for id in ["id-a", "id-b", "id-c"]
    ]

    with pytest.raises(LabwareOffsetNotFoundError):
        subject.delete("b")

    subject.add(a)
    subject.add(b)
    subject.add(c)
    assert subject.delete(b.id) == b
    assert _get_all(subject) == [a, c]
    with pytest.raises(LabwareOffsetNotFoundError):
        subject.delete(b.id)

    subject.delete_all()
    assert _get_all(subject) == []
