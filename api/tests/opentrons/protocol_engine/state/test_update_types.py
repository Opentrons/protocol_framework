"""Unit tests for the utilities in `update_types`."""


from opentrons.protocol_engine.state import update_types


def test_append() -> None:
    """Test `StateUpdate.append()`."""
    state_update = update_types.StateUpdate(
        absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
            module_id="module_id", is_lid_on=True
        )
    )

    # Populating a new field should leave the original ones unchanged.
    result = state_update.append(
        update_types.StateUpdate(pipette_location=update_types.CLEAR)
    )
    assert result is state_update
    assert state_update.absorbance_reader_lid == update_types.AbsorbanceReaderLidUpdate(
        module_id="module_id", is_lid_on=True
    )
    assert state_update.pipette_location == update_types.CLEAR

    # Populating a field that's already been populated should overwrite it.
    result = state_update.append(
        update_types.StateUpdate(
            absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
                module_id="module_id", is_lid_on=False
            )
        )
    )
    assert result is state_update
    assert state_update.absorbance_reader_lid == update_types.AbsorbanceReaderLidUpdate(
        module_id="module_id", is_lid_on=False
    )
    assert state_update.pipette_location == update_types.CLEAR


def test_reduce() -> None:
    """Test `StateUpdate.reduce()`."""
    assert update_types.StateUpdate.reduce() == update_types.StateUpdate()

    # It should union all the set fields together.
    assert update_types.StateUpdate.reduce(
        update_types.StateUpdate(
            absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
                module_id="module_id", is_lid_on=True
            )
        ),
        update_types.StateUpdate(pipette_location=update_types.CLEAR),
    ) == update_types.StateUpdate(
        absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
            module_id="module_id", is_lid_on=True
        ),
        pipette_location=update_types.CLEAR,
    )

    # When one field appears multiple times, the last write wins.
    assert update_types.StateUpdate.reduce(
        update_types.StateUpdate(
            absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
                module_id="module_id", is_lid_on=True
            )
        ),
        update_types.StateUpdate(
            absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
                module_id="module_id", is_lid_on=False
            )
        ),
    ) == update_types.StateUpdate(
        absorbance_reader_lid=update_types.AbsorbanceReaderLidUpdate(
            module_id="module_id", is_lid_on=False
        )
    )
