# noqa: D100


from datetime import datetime, timezone
from opentrons.protocol_engine import (
    LabwareOffset,
    LabwareOffsetLocation,
    LabwareOffsetVector,
)
from opentrons.types import DeckSlotName
import pytest
import sqlalchemy
from robot_server.labware_offsets.store import (
    LabwareOffsetStore,
    LabwareOffsetNotFoundError,
)


@pytest.fixture
def subject(sql_engine: sqlalchemy.engine.Engine) -> LabwareOffsetStore:
    """Return a test subject."""
    return LabwareOffsetStore(sql_engine)


def _get_all(store: LabwareOffsetStore) -> list[LabwareOffset]:
    return store.search()


def test_filters(subject: LabwareOffsetStore) -> None:
    """Test that the `.search()` method applies filters correctly."""
    ids_and_definition_uris = [
        ("id-1", "definition-uri-a"),
        ("id-2", "definition-uri-b"),
        ("id-3", "definition-uri-a"),
        ("id-4", "definition-uri-b"),
        ("id-5", "definition-uri-a"),
        ("id-6", "definition-uri-b"),
    ]
    labware_offsets = [
        LabwareOffset(
            id=id,
            createdAt=datetime.now(timezone.utc),
            definitionUri=definition_uri,
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_A1),
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
        LabwareOffset(
            id=id,
            createdAt=datetime.now(timezone.utc),
            definitionUri="",
            location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_A1),
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
