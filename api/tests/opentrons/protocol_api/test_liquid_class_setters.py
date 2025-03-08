import pytest
from opentrons.protocol_api._liquid_properties import (
    DelayProperties,
    TouchTipProperties,
    MixProperties,
    BlowoutProperties,
    Submerge,
    AspirateProperties,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import BlowoutLocation
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
)


@pytest.mark.parametrize("bad_value", ["True", 123, 1.0, 1, 0])
def test_delay_properties_enabled_raises_no_duration(bad_value):
    dp = DelayProperties(_enabled=False, _duration=None)
    with pytest.raises(ValueError):
        dp.enabled = bad_value


@pytest.mark.parametrize("bad_duration", [-1.0, 0.0, 0, "1", True])
def test_delay_properties_negative_zero_duration_raises(bad_duration):
    dp = DelayProperties(_enabled=False, _duration=None)
    with pytest.raises(ValueError):
        dp.duration = bad_duration


@pytest.mark.parametrize("bad_enable", ["True", 1, 0])
def test_touch_tip_enable_raises_if_params_missing(bad_enable):
    tip = TouchTipProperties(
        _enabled=False, _z_offset=None, _mm_to_edge=None, _speed=None
    )
    with pytest.raises(ValueError):
        tip.enabled = bad_enable


@pytest.mark.parametrize("bad_z_offset", [None, "nope", True])
def test_touch_tip_z_offset_invalid_raises(bad_z_offset):
    tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
    with pytest.raises(ValueError):
        tip.z_offset = bad_z_offset


@pytest.mark.parametrize("bad_mm_to_edge", [True, "foo"])
def test_touch_tip_mm_to_edge_invalid_raises(bad_mm_to_edge):
    tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
    with pytest.raises(ValueError):
        tip.mm_to_edge = bad_mm_to_edge


@pytest.mark.parametrize("bad_speed", [0.0, -3.5, "fast", True])
def test_touch_tip_speed_invalid_raises(bad_speed):
    tip = TouchTipProperties(_enabled=False, _z_offset=1.0, _mm_to_edge=2.0, _speed=5.0)
    with pytest.raises(ValueError):
        tip.speed = bad_speed


@pytest.mark.parametrize("bad_enable", ["True", 1, True])
def test_mix_enable_raises_if_no_reps_or_volume(bad_enable):
    mp = MixProperties(_enabled=False, _repetitions=None, _volume=None)
    with pytest.raises(ValueError):
        mp.enabled = bad_enable


@pytest.mark.parametrize("bad_reps", [0, -2, "four", 3.5])
def test_mix_repetitions_invalid_raises(bad_reps):
    mp = MixProperties(_enabled=False, _repetitions=None, _volume=None)
    with pytest.raises(ValueError):
        mp.repetitions = bad_reps


@pytest.mark.parametrize("bad_volume", [0, -5.5, -1, "ten", True])
def test_mix_volume_invalid_raises(bad_volume):
    mp = MixProperties(_enabled=False, _repetitions=2, _volume=None)
    with pytest.raises(ValueError):
        mp.volume = bad_volume


@pytest.mark.parametrize("bad_enable", [True, 1, "True", "yes"])
def test_blowout_enable_raises_if_location_flow_rate_missing(bad_enable):
    bp = BlowoutProperties(_enabled=False, _location=None, _flow_rate=None)
    with pytest.raises(ValueError):
        bp.enabled = bad_enable


@pytest.mark.parametrize("invalid_loc", ["", "some_bad_loc"])
def test_blowout_invalid_location_raises(invalid_loc):
    bp = BlowoutProperties(_enabled=False, _location=None, _flow_rate=10.0)
    with pytest.raises(ValueError):
        bp.location = invalid_loc


@pytest.mark.parametrize("bad_flow", [0.0, -10.0, "fast", True])
def test_blowout_flow_rate_invalid_raises(bad_flow):
    bp = BlowoutProperties(
        _enabled=False, _location=BlowoutLocation("destination"), _flow_rate=10
    )
    with pytest.raises(ValueError):
        bp.flow_rate = bad_flow


@pytest.mark.parametrize("bad_position", ["invalid_position", 42])
def test_submerge_position_reference_raises(bad_position):
    s = Submerge(
        _position_reference=PositionReference.WELL_BOTTOM,
        _offset=(0, 0, 0),
        _speed=10.0,
        _delay=DelayProperties(_enabled=False, _duration=None),
    )
    with pytest.raises(ValueError):
        s.position_reference = bad_position


@pytest.mark.parametrize("bad_offset", [(0, 0), "xyz", True, 1.0])
def test_submerge_offset_raises(bad_offset):
    s = Submerge(
        _position_reference=PositionReference.WELL_TOP,
        _offset=(0, 0, 0),
        _speed=5.0,
        _delay=DelayProperties(_enabled=False, _duration=None),
    )
    with pytest.raises(
        ValueError,
    ):
        s.offset = bad_offset


@pytest.mark.parametrize("bad_speed", [0.0, -1.0, "fast", True])
def test_submerge_speed_raises(bad_speed):
    s = Submerge(
        _position_reference=PositionReference.WELL_CENTER,
        _offset=(0, 0, 0),
        _speed=10.0,
        _delay=DelayProperties(_enabled=False, _duration=None),
    )
    with pytest.raises(ValueError):
        s.speed = bad_speed


@pytest.mark.parametrize("bad_position", ["X", 999])
def test_base_liquid_handling_position_reference_raises(bad_position):
    ap = AspirateProperties(
        _submerge=Submerge(
            _position_reference=PositionReference.WELL_TOP,
            _offset=(0, 0, 0),
            _speed=1.0,
            _delay=DelayProperties(_enabled=False, _duration=None),
        ),
        _retract=None,
        _position_reference=PositionReference.WELL_TOP,
        _offset=(1, 1, 1),
        _flow_rate_by_volume=None,
        _correction_by_volume=None,
        _pre_wet=False,
        _mix=MixProperties(_enabled=False, _repetitions=None, _volume=None),
        _delay=DelayProperties(_enabled=False, _duration=None),
    )
    with pytest.raises(ValueError):
        ap.position_reference = bad_position


@pytest.mark.parametrize("bad_offset", [[1, 2], 123, True, "offset"])
def test_base_liquid_handling_offset_raises(bad_offset):
    ap = AspirateProperties(
        _submerge=Submerge(
            _position_reference=PositionReference.WELL_TOP,
            _offset=(0, 0, 0),
            _speed=1.0,
            _delay=DelayProperties(_enabled=False, _duration=None),
        ),
        _retract=None,
        _position_reference=PositionReference.WELL_BOTTOM,
        _offset=(1, 1, 1),
        _flow_rate_by_volume=None,
        _correction_by_volume=None,
        _pre_wet=False,
        _mix=MixProperties(_enabled=False, _repetitions=None, _volume=None),
        _delay=DelayProperties(_enabled=False, _duration=None),
    )
    with pytest.raises(ValueError):
        ap.offset = bad_offset


@pytest.mark.parametrize("bad_pre_wet", [42, "not_bool"])
def test_aspirate_properties_pre_wet_invalid(bad_pre_wet):
    ap = AspirateProperties(
        _submerge=Submerge(
            _position_reference=PositionReference.WELL_BOTTOM,
            _offset=(0, 0, 0),
            _speed=1.0,
            _delay=DelayProperties(_enabled=False, _duration=None),
        ),
        _retract=None,
        _position_reference=PositionReference.WELL_BOTTOM,
        _offset=(0, 0, 0),
        _flow_rate_by_volume=None,
        _correction_by_volume=None,
        _pre_wet=False,
        _mix=MixProperties(_enabled=False, _repetitions=None, _volume=None),
        _delay=DelayProperties(_enabled=False, _duration=None),
    )
    with pytest.raises(ValueError):
        ap.pre_wet = bad_pre_wet
