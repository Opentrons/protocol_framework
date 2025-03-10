"""Tests for liquid class property setter validations using Hypothesis.

In each test, we describe:
- What the property setter expects as VALID input.
- What we consider INVALID, which should raise a ValueError.

We use Hypothesis to generate various invalid values, filtering out anything
that would actually be valid with `assume(...)`.
"""

import pytest
from typing import Any, Union, cast
from hypothesis import given, strategies as st, settings, assume

from opentrons.protocol_api._liquid_properties import (
    DelayProperties,
    TouchTipProperties,
    MixProperties,
    BlowoutProperties,
    Submerge,
    AspirateProperties,
    RetractAspirate,
    LiquidHandlingPropertyByVolume,
)

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
    BlowoutLocation,
    Coordinate,
)

# --------------------------------------------------------------------------------------
# Strategies
# --------------------------------------------------------------------------------------

# Values that dont work for any setters:
invalid_values = st.one_of(
    st.text(min_size=0, max_size=5),
    st.dictionaries(keys=st.text(), values=st.integers()),
    st.lists(st.integers(min_value=-100, max_value=100), min_size=1, max_size=5),
    st.tuples(st.booleans()),
    st.binary(min_size=1, max_size=5),
)

true_looking_values = st.one_of(
    st.just("True"),
    st.just("1"),
    st.just(1),
)

reasonable_floats = st.floats(
    min_value=-1000, max_value=1000, allow_infinity=False, allow_nan=False
)
reasonable_ints = st.integers(min_value=-1000, max_value=1000)

# 0 inclusive floats and ints
negative_or_zero_floats = st.floats(
    min_value=-1000, max_value=0, allow_infinity=False, allow_nan=False
)
negative_or_zero_ints = st.integers(min_value=-1000, max_value=0)
negative_or_zero_floats_and_ints = st.one_of(
    negative_or_zero_floats, negative_or_zero_ints
)
positive_or_zero_ints = st.integers(min_value=0, max_value=1000)
positive_or_zero_floats = st.floats(
    min_value=0, max_value=1000, allow_infinity=False, allow_nan=False
)
positive_or_zero_floats_or_ints = st.one_of(
    positive_or_zero_floats, positive_or_zero_ints
)

# 0 exclusive floats and ints
negative_non_zero_floats = st.floats(
    min_value=-1000, max_value=-0.0001, allow_infinity=False, allow_nan=False
)
negative_non_zero_ints = st.integers(min_value=-1000, max_value=-1)
negative_non_zero_floats_and_ints = st.one_of(
    negative_non_zero_floats, negative_non_zero_ints
)

positive_non_zero_floats = st.floats(
    min_value=0.0001, max_value=1000, allow_infinity=False, allow_nan=False
)
positive_non_zero_ints = st.integers(min_value=1, max_value=1000)
positive_non_zero_floats_and_ints = st.one_of(
    positive_non_zero_floats, positive_non_zero_ints
)


# --------------------------------------------------------------------------------------
# DelayProperties
# --------------------------------------------------------------------------------------


def test_delay_properties_enable_and_disable() -> None:
    """
    Boolean only
    """
    dp = DelayProperties(_enabled=False, _duration=1)
    dp.enabled = True
    assert dp.enabled == True
    dp.enabled = False
    assert dp.enabled == False


def test_delay_properties_properties_instantiation() -> None:
    """
    DisplayProperties None combinations
    """
    dp = DelayProperties(_enabled=None, _duration=None)  # type: ignore
    dp = DelayProperties(_enabled=False, _duration=None)
    dp = DelayProperties(_enabled=None, _duration=1)  # type: ignore
    with pytest.raises(ValueError):
        dp = DelayProperties(_enabled=True, _duration=None)


@given(
    bad_value=st.one_of(
        invalid_values,
        true_looking_values,
    )
)
@settings(deadline=None, max_examples=50)
def test_delay_properties__enabled_bad_values(bad_value: Any) -> None:
    """
    Bad values for DelayProperties.enabled.
    """
    # instantiation
    with pytest.raises(ValueError):
        dp = DelayProperties(_enabled=bad_value, _duration=1)
    # setter
    dp = DelayProperties(_enabled=True, _duration=1)
    with pytest.raises(ValueError):
        dp.enabled = bad_value


@given(good_duration=positive_or_zero_floats_or_ints)
@settings(deadline=None, max_examples=50)
def test_delay_properties_duration(good_duration: Union[int, float]) -> None:
    """
    Float/int  >= 0
    """
    # instantiation
    dp = DelayProperties(_enabled=None, _duration=good_duration)  # type: ignore
    assert dp.duration == float(good_duration)
    dp = DelayProperties(_enabled=False, _duration=good_duration)
    # setter
    dp = DelayProperties(_enabled=True, _duration=1)
    dp.duration = good_duration
    assert dp.duration == float(good_duration)


@given(
    bad_duration=st.one_of(
        negative_non_zero_floats_and_ints,
        invalid_values,
    )
)
@settings(deadline=None, max_examples=50)
def test_delay_properties_duration_bad_values(bad_duration: Any) -> None:
    """
    Float/int >= 0
    """
    # instantiation
    with pytest.raises(ValueError):
        dp = DelayProperties(_enabled=True, _duration=bad_duration)
    with pytest.raises(ValueError):
        dp = DelayProperties(_enabled=False, _duration=bad_duration)
    # setter
    dp = DelayProperties(_enabled=True, _duration=1)
    with pytest.raises(ValueError):
        dp.duration = bad_duration
    dp = DelayProperties(_enabled=False, _duration=1)
    with pytest.raises(ValueError):
        dp.duration = bad_duration


# --------------------------------------------------------------------------------------
# TouchTipProperties
# --------------------------------------------------------------------------------------


# def test_touch_tip_enable_raises_if_params_missing() -> None:
#     """
#     If any param none, then enabling raises ValueError.
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=None, _mm_to_edge=1, _speed=1)
#     with pytest.raises(ValueError):
#         tip.enabled = True

#     tip = TouchTipProperties(_enabled=False, _z_offset=1, _mm_to_edge=None, _speed=1)
#     with pytest.raises(ValueError):
#         tip.enabled = True
#     tip = TouchTipProperties(_enabled=False, _z_offset=1, _mm_to_edge=1, _speed=None)
#     with pytest.raises(ValueError):
#         tip.enabled = True
#     tip = TouchTipProperties(
#         _enabled=False, _z_offset=None, _mm_to_edge=None, _speed=None
#     )
#     with pytest.raises(ValueError):
#         tip.enabled = True


# def test_touch_tip_enabled_successfully() -> None:
#     """
#     Acceptable values for tip.enabled are boolean True/False.
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=1, _mm_to_edge=1, _speed=1)
#     tip.enabled = True
#     assert tip.enabled == True
#     tip.enabled = False
#     assert tip.enabled == False
#     # if instantiated in a bad state, we can set it to False
#     tip = TouchTipProperties(
#         _enabled=True, _z_offset=None, _mm_to_edge=None, _speed=None
#     )
#     tip.enabled = False
#     assert tip.enabled == False


# @given(bad_z_offset=st.one_of(invalid_values))
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_z_offset_invalid_raises(bad_z_offset: Any) -> None:
#     """
#     reasonable floats and ints
#     """
#     tip = TouchTipProperties(
#         _enabled=False, _z_offset=None, _mm_to_edge=2.0, _speed=5.0
#     )

#     with pytest.raises(ValueError):
#         tip.z_offset = bad_z_offset


# @given(good_z_offset=st.one_of(reasonable_floats, reasonable_ints))
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_z_offset_valid(good_z_offset: Union[int, float]) -> None:
#     """
#     reasonable floats and ints
#     """
#     tip = TouchTipProperties(
#         _enabled=False, _z_offset=None, _mm_to_edge=2.0, _speed=5.0
#     )
#     tip.z_offset = good_z_offset
#     assert tip.z_offset == good_z_offset


# @given(bad_z_offset=st.one_of(invalid_values, st.booleans()))
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_z_offset_invalid_raises(bad_z_offset: Any) -> None:
#     """
#     reasonable floats and ints
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
#     with pytest.raises(ValueError):
#         tip.z_offset = bad_z_offset


# @given(bad_mm_to_edge=invalid_values)
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_mm_to_edge_invalid_raises(bad_mm_to_edge: Any) -> None:
#     """
#     reasonable floats and ints
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
#     with pytest.raises(ValueError):
#         tip.mm_to_edge = bad_mm_to_edge


# @given(good_mm_to_edge=st.one_of(reasonable_floats, reasonable_ints))
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_mm_to_edge_valid(good_mm_to_edge: Union[int, float]) -> None:
#     """
#     reasonable floats and ints
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
#     tip.mm_to_edge = good_mm_to_edge
#     assert tip.mm_to_edge == float(good_mm_to_edge)


# @given(
#     bad_speed=st.one_of(negative_or_zero_floats, negative_or_zero_ints, invalid_values)
# )
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_speed_invalid_raises(bad_speed: Any) -> None:
#     """
#     positive not zero floats and ints
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
#     with pytest.raises(ValueError):
#         tip.speed = bad_speed


# @given(good_speed=positive_non_zero_floats_and_ints)
# @settings(deadline=None, max_examples=50)
# def test_touch_tip_speed_valid(good_speed: Union[int, float]) -> None:
#     """
#     positive not zero floats and ints
#     """
#     tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
#     tip.speed = good_speed
#     assert tip.speed == float(good_speed)


# # --------------------------------------------------------------------------------------
# # MixProperties
# # --------------------------------------------------------------------------------------


# def test_mix_enable_raises_if_no_reps_or_volume() -> None:
#     """
#     Acceptable values for mp.enabled are:
#       - Boolean False => no error (disable).
#       - Boolean True => requires repetitions and volume to be valid.
#     """
#     mp = MixProperties(_enabled=False, _repetitions=None, _volume=None)
#     with pytest.raises(ValueError):
#         mp.enabled = True
#     mp = MixProperties(_enabled=False, _repetitions=1, _volume=None)
#     with pytest.raises(ValueError):
#         mp.enabled = True
#     mp = MixProperties(_enabled=False, _repetitions=None, _volume=1)
#     with pytest.raises(ValueError):
#         mp.enabled = True


# def test_mix_enable_successfully() -> None:
#     """
#     Acceptable values for mp.enabled are boolean True/False.
#     """
#     mp = MixProperties(_enabled=False, _repetitions=1, _volume=1)
#     mp.enabled = True
#     assert mp.enabled == True
#     mp.enabled = False
#     assert mp.enabled == False
#     # if instantiated in a bad state, we can set it to False
#     mp = MixProperties(_enabled=True, _repetitions=None, _volume=None)
#     mp.enabled = False
#     assert mp.enabled == False


# @given(
#     bad_reps=st.one_of(
#         negative_or_zero_ints,
#         reasonable_floats,
#         invalid_values,
#         st.booleans(),
#     )
# )
# @settings(deadline=None, max_examples=50)
# def test_mix_repetitions_invalid_raises(bad_reps: Any) -> None:
#     """
#     not zero positive int
#     """
#     mp = MixProperties(_enabled=True, _repetitions=1, _volume=1)
#     with pytest.raises(ValueError):
#         mp.repetitions = bad_reps

# @given(
#     good_reps=positive_non_zero_ints
# )
# @settings(deadline=None, max_examples=50)
# def test_mix_repetitions_successfully(good_reps: int) -> None:
#     """
#     not zero positive int
#     """
#     mp = MixProperties(_enabled=True, _repetitions=None, _volume=1)
#     mp.repetitions = good_reps
#     assert mp.repetitions == good_reps

# @given(bad_volume=st.one_of(negative_or_zero_floats, negative_or_zero_ints, invalid_values))
# @settings(deadline=None, max_examples=50)
# def test_mix_volume_invalid_raises(bad_volume: Any) -> None:
#     """
#    positive not zero floats and ints
#     """
#     mp = MixProperties(_enabled=True, _repetitions=2, _volume=1)
#     with pytest.raises(ValueError):
#         mp.volume = bad_volume

# @given(good_volume=positive_not_zero_floats_or_ints)
# @settings(deadline=None, max_examples=50)
# def test_mix_volume_successfully(good_volume: Union[int, float]) -> None:
#     """
#     positive not zero floats and ints
#     """
#     mp = MixProperties(_enabled=True, _repetitions=2, _volume=None)
#     mp.volume = good_volume
#     assert mp.volume == float(good_volume)

# # --------------------------------------------------------------------------------------
# # BlowoutProperties
# # --------------------------------------------------------------------------------------

# def test_blowout_enable_raises_if_location_or_flow_rate_missing() -> None:
#     """
#     Acceptable values for bp.enabled are:
#       - Boolean False => no error (disable).
#       - Boolean True => requires location and flow_rate to be valid.

#     We test enabling with location=None or flow_rate=None => ValueError.
#     """
#     bp = BlowoutProperties(_enabled=False,_location=BlowoutLocation.SOURCE, _flow_rate=None)
#     with pytest.raises(ValueError):
#         bp.enabled = True
#     bp = BlowoutProperties(_enabled=False, _location=None, _flow_rate=1)
#     with pytest.raises(ValueError):
#         bp.enabled = True
#     bp = BlowoutProperties(_enabled=False, _location=None, _flow_rate=None)
#     with pytest.raises(ValueError):
#         bp.enabled = True


# def test_blowout_set_successfully() -> None:
#     """
#     Acceptable values for bp.enabled are boolean True/False.
#     """
#     bp = BlowoutProperties(_enabled=False, _location=BlowoutLocation.SOURCE, _flow_rate=1)
#     bp.enabled = True
#     assert bp.enabled == True
#     bp.enabled = False
#     assert bp.enabled == False
#     # if instantiated in a bad state, we can set it to False
#     bp = BlowoutProperties(_enabled=True, _location=None, _flow_rate=None)
#     bp.enabled = False
#     assert bp.enabled == False

# @given(
#     bad_enabled=st.one_of(
#         invalid_values,
#         trueish_values,)
# )
# @settings(deadline=None, max_examples=50)
# def test_blowout_enabled_invalid_raises(bad_enabled: Any) -> None:
#     """
#     Acceptable values for bp.enabled are boolean True/False.
#     """
#     bp = BlowoutProperties(_enabled=False, _location=BlowoutLocation.SOURCE, _flow_rate=1)
#     with pytest.raises(ValueError):
#         bp.enabled = bad_enabled


# @given(invalid_loc=st.one_of(st.text(min_size=0, max_size=10), st.integers()))
# @settings(deadline=None, max_examples=50)
# def test_blowout_invalid_location_raises(invalid_loc: Any) -> None:
#     """
#     Acceptable values for bp.location are BlowoutLocation("source") or BlowoutLocation("destination").

#     We test anything else => ValueError.
#     """
#     bp = BlowoutProperties(_enabled=False, _location=None, _flow_rate=10.0)
#     # If it's a string that's exactly "source" or "destination", skip so we don't raise.
#     if isinstance(invalid_loc, str):
#         assume(invalid_loc not in ["source", "destination"])

#     with pytest.raises(ValueError):
#         bp.location = invalid_loc  # type: ignore


# @given(bad_flow=invalid_values)
# @settings(deadline=None, max_examples=50)
# def test_blowout_flow_rate_invalid_raises(bad_flow: Any) -> None:
#     """
#     Acceptable values for bp.flow_rate might be float > 0.

#     We test <= 0 or non-numeric => ValueError expected.
#     """
#     bp = BlowoutProperties(
#         _enabled=False, _location=BlowoutLocation("destination"), _flow_rate=10
#     )
#     if isinstance(bad_flow, (int, float)):
#         assume(bad_flow <= 0)

#     with pytest.raises(ValueError):
#         bp.flow_rate = bad_flow


# # --------------------------------------------------------------------------------------
# # Submerge
# # --------------------------------------------------------------------------------------


# @given(bad_position=st.one_of(st.text(min_size=1, max_size=10), st.integers()))
# @settings(deadline=None, max_examples=50)
# def test_submerge_position_reference_raises(bad_position: Any) -> None:
#     """
#     Acceptable values for s.position_reference are any valid PositionReference enum:
#       - WELL_BOTTOM
#       - WELL_TOP
#       - WELL_CENTER
#       etc.

#     We test other strings, or ints => ValueError expected.
#     """
#     s = Submerge(
#         _position_reference=PositionReference.WELL_BOTTOM,
#         _offset=cast(Coordinate, (0, 0, 0)),
#         _speed=10.0,
#         _delay=DelayProperties(_enabled=False, _duration=None),
#     )
#     if isinstance(bad_position, str):
#         assume(bad_position not in [ref.value for ref in PositionReference])

#     with pytest.raises(ValueError):
#         s.position_reference = bad_position


# @given(bad_offset=invalid_values)
# @settings(deadline=None, max_examples=50)
# def test_submerge_offset_raises(bad_offset: Any) -> None:
#     """
#     Acceptable values for s.offset are a 3-tuple of floats (x, y, z).
#     Example: (0.0, 0.0, -1.0)

#     We test anything else => ValueError expected.
#     """
#     s = Submerge(
#         _position_reference=PositionReference.WELL_TOP,
#         _offset=cast(Coordinate, (0, 0, 0)),
#         _speed=5.0,
#         _delay=DelayProperties(_enabled=False, _duration=None),
#     )
#     with pytest.raises(ValueError):
#         s.offset = bad_offset


# @given(bad_speed=invalid_values)
# @settings(deadline=None, max_examples=50)
# def test_submerge_speed_raises(bad_speed: Any) -> None:
#     """
#     Acceptable values for s.speed might be float > 0.

#     We test <= 0 or non-numeric => ValueError expected.
#     """
#     s = Submerge(
#         _position_reference=PositionReference.WELL_CENTER,
#         _offset=cast(Coordinate, (0, 0, 0)),
#         _speed=10.0,
#         _delay=DelayProperties(_enabled=False, _duration=None),
#     )
#     if isinstance(bad_speed, (int, float)):
#         assume(bad_speed <= 0)

#     with pytest.raises(ValueError):
#         s.speed = bad_speed


# # --------------------------------------------------------------------------------------
# # AspirateProperties (Base Liquid Handling)
# # --------------------------------------------------------------------------------------


# @given(bad_position=st.one_of(st.text(min_size=1, max_size=10), st.integers()))
# @settings(deadline=None, max_examples=50)
# def test_base_liquid_handling_position_reference_raises(bad_position: Any) -> None:
#     """
#     Acceptable values for ap.position_reference are valid PositionReference enums.

#     We test an unknown position => ValueError expected.
#     """
#     ap = AspirateProperties(
#         _submerge=Submerge(
#             _position_reference=PositionReference.WELL_TOP,
#             _offset=cast(Coordinate, (0, 0, 0)),
#             _speed=1.0,
#             _delay=DelayProperties(_enabled=False, _duration=None),
#         ),
#         _retract=None,
#         _position_reference=PositionReference.WELL_TOP,
#         _offset=cast(Coordinate, (1, 1, 1)),
#         _flow_rate_by_volume=None,
#         _correction_by_volume=None,
#         _pre_wet=False,
#         _mix=MixProperties(_enabled=False, _repetitions=None, _volume=None),
#         _delay=DelayProperties(_enabled=False, _duration=None),
#     )
#     if isinstance(bad_position, str):
#         assume(bad_position not in [ref.value for ref in PositionReference])

#     with pytest.raises(ValueError):
#         ap.position_reference = bad_position


# @given(bad_offset=invalid_values)
# @settings(deadline=None, max_examples=50)
# def test_base_liquid_handling_offset_raises(bad_offset: Any) -> None:
#     """
#     Acceptable values for ap.offset are a 3-tuple of floats (x, y, z).

#     We test anything else => ValueError expected.
#     """
#     ap = AspirateProperties(
#         _submerge=Submerge(
#             _position_reference=PositionReference.WELL_TOP,
#             _offset=cast(Coordinate, (0, 0, 0)),
#             _speed=1.0,
#             _delay=DelayProperties(_enabled=False, _duration=None),
#         ),
#         _retract=None,
#         _position_reference=PositionReference.WELL_BOTTOM,
#         _offset=cast(Coordinate, (1, 1, 1)),
#         _flow_rate_by_volume=None,
#         _correction_by_volume=None,
#         _pre_wet=False,
#         _mix=MixProperties(_enabled=False, _repetitions=None, _volume=None),
#         _delay=DelayProperties(_enabled=False, _duration=None),
#     )
#     with pytest.raises(ValueError):
#         ap.offset = bad_offset


# @given(bad_pre_wet=invalid_values)
# @settings(deadline=None, max_examples=50)
# def test_aspirate_properties_pre_wet_invalid(bad_pre_wet: Any) -> None:
#     """
#     Acceptable values for ap.pre_wet are booleans (True/False).

#     We test anything non-boolean => ValueError expected.
#     """
#     ap = AspirateProperties(
#         _submerge=Submerge(
#             _position_reference=PositionReference.WELL_BOTTOM,
#             _offset=cast(Coordinate, (0, 0, 0)),
#             _speed=1.0,
#             _delay=DelayProperties(_enabled=False, _duration=None),
#         ),
#         _retract=None,
#         _position_reference=PositionReference.WELL_BOTTOM,
#         _offset=cast(Coordinate, (0, 0, 0)),
#         _flow_rate_by_volume=None,
#         _correction_by_volume=None,
#         _pre_wet=False,
#         _mix=MixProperties(_enabled=False, _repetitions=None, _volume=None),
#         _delay=DelayProperties(_enabled=False, _duration=None),
#     )
#     # If it's a boolean, that's valid, so skip it.
#     assume(not isinstance(bad_pre_wet, bool))

#     with pytest.raises(ValueError):
#         ap.pre_wet = bad_pre_wet
