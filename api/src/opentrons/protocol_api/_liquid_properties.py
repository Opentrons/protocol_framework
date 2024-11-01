from dataclasses import dataclass
from typing import Optional, Dict, Sequence

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    AspirateProperties as SharedDataAspirateProperties,
    SingleDispenseProperties as SharedDataSingleDispenseProperties,
    MultiDispenseProperties as SharedDataMultiDispenseProperties,
    DelayProperties as SharedDataDelayProperties,
    TouchTipProperties as SharedDataTouchTipProperties,
    MixProperties as SharedDataMixProperties,
    BlowoutProperties as SharedDataBlowoutProperties,
    Submerge as SharedDataSubmerge,
    RetractAspirate as SharedDataRetractAspirate,
    RetractDispense as SharedDataRetractDispense,
    BlowoutLocation,
    PositionReference,
    Coordinate,
)

# TODO replace this with a class that can extrapolate given volumes to the correct float,
#   also figure out how we want people to be able to set this
LiquidHandlingPropertyByVolume = Dict[str, float]


@dataclass
class DelayProperties:

    _enabled: bool
    _duration: Optional[float]

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, enable: bool) -> None:
        # TODO insert bool validation here
        if enable and self._duration is None:
            raise ValueError("duration must be set before enabling delay.")
        self._enabled = enable

    @property
    def duration(self) -> Optional[float]:
        return self._duration

    @duration.setter
    def duration(self, new_duration: float) -> None:
        # TODO insert positive float validation here
        self._duration = new_duration


@dataclass
class TouchTipProperties:

    _enabled: bool
    _z_offset: Optional[float]
    _mm_to_edge: Optional[float]
    _speed: Optional[float]

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, enable: bool) -> None:
        # TODO insert bool validation here
        if enable and (
            self._z_offset is None or self._mm_to_edge is None or self._speed is None
        ):
            raise ValueError(
                "z_offset, mm_to_edge and speed must be set before enabling touch tip."
            )
        self._enabled = enable

    @property
    def z_offset(self) -> Optional[float]:
        return self._z_offset

    @z_offset.setter
    def z_offset(self, new_offset: float) -> None:
        # TODO validation for float
        self._z_offset = new_offset

    @property
    def mm_to_edge(self) -> Optional[float]:
        return self._mm_to_edge

    @mm_to_edge.setter
    def mm_to_edge(self, new_mm: float) -> None:
        # TODO validation for float
        self._z_offset = new_mm

    @property
    def speed(self) -> Optional[float]:
        return self._speed

    @speed.setter
    def speed(self, new_speed: float) -> None:
        # TODO insert positive float validation here
        self._speed = new_speed


@dataclass
class MixProperties:

    _enabled: bool
    _repetitions: Optional[int]
    _volume: Optional[float]

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, enable: bool) -> None:
        # TODO insert bool validation here
        if enable and (self._repetitions is None or self._volume is None):
            raise ValueError("repetitions and volume must be set before enabling mix.")
        self._enabled = enable

    @property
    def repetitions(self) -> Optional[int]:
        return self._repetitions

    @repetitions.setter
    def repetitions(self, new_repetitions: int) -> None:
        # TODO validations for positive int
        self._repetitions = new_repetitions

    @property
    def volume(self) -> Optional[float]:
        return self._volume

    @volume.setter
    def volume(self, new_volume: float) -> None:
        # TODO validations for volume float
        self._volume = new_volume


@dataclass
class BlowoutProperties:

    _enabled: bool
    _location: Optional[BlowoutLocation]
    _flow_rate: Optional[float]

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, enable: bool) -> None:
        # TODO insert bool validation here
        if enable and (self._location is None or self._flow_rate is None):
            raise ValueError(
                "location and flow_rate must be set before enabling blowout."
            )
        self._enabled = enable

    @property
    def location(self) -> Optional[BlowoutLocation]:
        return self._location

    @location.setter
    def location(self, new_location: str) -> None:
        # TODO blowout location validation
        self._location = BlowoutLocation(new_location)

    @property
    def flow_rate(self) -> Optional[float]:
        return self._flow_rate

    @flow_rate.setter
    def flow_rate(self, new_flow_rate: float) -> None:
        # TODO validations for positive float
        self._flow_rate = new_flow_rate


@dataclass
class SubmergeRetractCommon:

    _position_reference: PositionReference
    _offset: Coordinate
    _speed: float
    _delay: DelayProperties

    @property
    def position_reference(self) -> PositionReference:
        return self._position_reference

    @position_reference.setter
    def position_reference(self, new_position: str) -> None:
        # TODO validation for position reference
        self._position_reference = PositionReference(new_position)

    @property
    def offset(self) -> Coordinate:
        return self._offset

    @offset.setter
    def offset(self, new_offset: Sequence[float]) -> None:
        # TODO validate valid coordinates
        self._offset = Coordinate(x=new_offset[0], y=new_offset[1], z=new_offset[2])

    @property
    def speed(self) -> float:
        return self._speed

    @speed.setter
    def speed(self, new_speed: float) -> None:
        # TODO insert positive float validation here
        self._speed = new_speed

    @property
    def delay(self) -> DelayProperties:
        return self._delay


@dataclass
class Submerge(SubmergeRetractCommon):
    ...


@dataclass
class RetractAspirate(SubmergeRetractCommon):

    _air_gap_by_volume: LiquidHandlingPropertyByVolume
    _touch_tip: TouchTipProperties

    @property
    def air_gap_by_volume(self) -> LiquidHandlingPropertyByVolume:
        return self._air_gap_by_volume

    @property
    def touch_tip(self) -> TouchTipProperties:
        return self._touch_tip


@dataclass
class RetractDispense(SubmergeRetractCommon):

    _air_gap_by_volume: LiquidHandlingPropertyByVolume
    _touch_tip: TouchTipProperties
    _blowout: BlowoutProperties

    @property
    def air_gap_by_volume(self) -> LiquidHandlingPropertyByVolume:
        return self._air_gap_by_volume

    @property
    def touch_tip(self) -> TouchTipProperties:
        return self._touch_tip

    @property
    def blowout(self) -> BlowoutProperties:
        return self._blowout


@dataclass
class BaseLiquidHandlingProperties:

    _submerge: Submerge
    _position_reference: PositionReference
    _offset: Coordinate
    _flow_rate_by_volume: LiquidHandlingPropertyByVolume
    _delay: DelayProperties

    @property
    def submerge(self) -> Submerge:
        return self._submerge

    @property
    def position_reference(self) -> PositionReference:
        return self._position_reference

    @position_reference.setter
    def position_reference(self, new_position: str) -> None:
        # TODO validation for position reference
        self._position_reference = PositionReference(new_position)

    @property
    def offset(self) -> Coordinate:
        return self._offset

    @offset.setter
    def offset(self, new_offset: Sequence[float]) -> None:
        # TODO validate valid coordinates
        self._offset = Coordinate(x=new_offset[0], y=new_offset[1], z=new_offset[2])

    @property
    def flow_rate_by_volume(self) -> LiquidHandlingPropertyByVolume:
        return self._flow_rate_by_volume

    @property
    def delay(self) -> DelayProperties:
        return self._delay


@dataclass
class AspirateProperties(BaseLiquidHandlingProperties):

    _retract: RetractAspirate
    _pre_wet: bool
    _mix: MixProperties

    @property
    def pre_wet(self) -> bool:
        return self._pre_wet

    @pre_wet.setter
    def pre_wet(self, new_setting: bool) -> None:
        # TODO boolean validation
        self._pre_wet = new_setting

    @property
    def retract(self) -> RetractAspirate:
        return self._retract

    @property
    def mix(self) -> MixProperties:
        return self._mix


@dataclass
class SingleDispenseProperties(BaseLiquidHandlingProperties):

    _retract: RetractDispense
    _push_out_by_volume: LiquidHandlingPropertyByVolume
    _mix: MixProperties

    @property
    def push_out_by_volume(self) -> LiquidHandlingPropertyByVolume:
        return self._push_out_by_volume

    @property
    def retract(self) -> RetractDispense:
        return self._retract

    @property
    def mix(self) -> MixProperties:
        return self._mix


@dataclass
class MultiDispenseProperties(BaseLiquidHandlingProperties):

    _retract: RetractDispense
    _conditioning_by_volume: LiquidHandlingPropertyByVolume
    _disposal_by_volume: LiquidHandlingPropertyByVolume

    @property
    def retract(self) -> RetractDispense:
        return self._retract

    @property
    def conditioning_by_volume(self) -> LiquidHandlingPropertyByVolume:
        return self._conditioning_by_volume

    @property
    def disposal_by_volume(self) -> LiquidHandlingPropertyByVolume:
        return self._disposal_by_volume


def _build_delay_properties(
    delay_properties: SharedDataDelayProperties,
) -> DelayProperties:
    if delay_properties.params is not None:
        duration = delay_properties.params.duration
    else:
        duration = None
    return DelayProperties(_enabled=delay_properties.enable, _duration=duration)


def _build_touch_tip_properties(
    touch_tip_properties: SharedDataTouchTipProperties,
) -> TouchTipProperties:
    if touch_tip_properties.params is not None:
        z_offset = touch_tip_properties.params.zOffset
        mm_to_edge = touch_tip_properties.params.mmToEdge
        speed = touch_tip_properties.params.speed
    else:
        z_offset = None
        mm_to_edge = None
        speed = None
    return TouchTipProperties(
        _enabled=touch_tip_properties.enable,
        _z_offset=z_offset,
        _mm_to_edge=mm_to_edge,
        _speed=speed,
    )


def _build_mix_properties(
    mix_properties: SharedDataMixProperties,
) -> MixProperties:
    if mix_properties.params is not None:
        repetitions = mix_properties.params.repetitions
        volume = mix_properties.params.volume
    else:
        repetitions = None
        volume = None
    return MixProperties(
        _enabled=mix_properties.enable, _repetitions=repetitions, _volume=volume
    )


def _build_blowout_properties(
    blowout_properties: SharedDataBlowoutProperties,
) -> BlowoutProperties:
    if blowout_properties.params is not None:
        location = blowout_properties.params.location
        flow_rate = blowout_properties.params.flowRate
    else:
        location = None
        flow_rate = None
    return BlowoutProperties(
        _enabled=blowout_properties.enable, _location=location, _flow_rate=flow_rate
    )


def _build_submerge(
    submerge_properties: SharedDataSubmerge,
) -> Submerge:
    return Submerge(
        _position_reference=submerge_properties.positionReference,
        _offset=submerge_properties.offset,
        _speed=submerge_properties.speed,
        _delay=_build_delay_properties(submerge_properties.delay),
    )


def _build_retract_aspirate(
    retract_aspirate: SharedDataRetractAspirate,
) -> RetractAspirate:
    return RetractAspirate(
        _position_reference=retract_aspirate.positionReference,
        _offset=retract_aspirate.offset,
        _speed=retract_aspirate.speed,
        _air_gap_by_volume=retract_aspirate.airGapByVolume,
        _touch_tip=_build_touch_tip_properties(retract_aspirate.touchTip),
        _delay=_build_delay_properties(retract_aspirate.delay),
    )


def _build_retract_dispense(
    retract_dispense: SharedDataRetractDispense,
) -> RetractDispense:
    return RetractDispense(
        _position_reference=retract_dispense.positionReference,
        _offset=retract_dispense.offset,
        _speed=retract_dispense.speed,
        _air_gap_by_volume=retract_dispense.airGapByVolume,
        _blowout=_build_blowout_properties(retract_dispense.blowout),
        _touch_tip=_build_touch_tip_properties(retract_dispense.touchTip),
        _delay=_build_delay_properties(retract_dispense.delay),
    )


def build_aspirate_properties(
    aspirate_properties: SharedDataAspirateProperties,
) -> AspirateProperties:
    return AspirateProperties(
        _submerge=_build_submerge(aspirate_properties.submerge),
        _retract=_build_retract_aspirate(aspirate_properties.retract),
        _position_reference=aspirate_properties.positionReference,
        _offset=aspirate_properties.offset,
        _flow_rate_by_volume=aspirate_properties.flowRateByVolume,
        _pre_wet=aspirate_properties.preWet,
        _mix=_build_mix_properties(aspirate_properties.mix),
        _delay=_build_delay_properties(aspirate_properties.delay),
    )


def build_single_dispense_properties(
    single_dispense_properties: SharedDataSingleDispenseProperties,
) -> SingleDispenseProperties:
    return SingleDispenseProperties(
        _submerge=_build_submerge(single_dispense_properties.submerge),
        _retract=_build_retract_dispense(single_dispense_properties.retract),
        _position_reference=single_dispense_properties.positionReference,
        _offset=single_dispense_properties.offset,
        _flow_rate_by_volume=single_dispense_properties.flowRateByVolume,
        _mix=_build_mix_properties(single_dispense_properties.mix),
        _push_out_by_volume=single_dispense_properties.pushOutByVolume,
        _delay=_build_delay_properties(single_dispense_properties.delay),
    )


def build_multi_dispense_properties(
    multi_dispense_properties: Optional[SharedDataMultiDispenseProperties],
) -> Optional[MultiDispenseProperties]:
    if multi_dispense_properties is None:
        return None
    return MultiDispenseProperties(
        _submerge=_build_submerge(multi_dispense_properties.submerge),
        _retract=_build_retract_dispense(multi_dispense_properties.retract),
        _position_reference=multi_dispense_properties.positionReference,
        _offset=multi_dispense_properties.offset,
        _flow_rate_by_volume=multi_dispense_properties.flowRateByVolume,
        _conditioning_by_volume=multi_dispense_properties.conditioningByVolume,
        _disposal_by_volume=multi_dispense_properties.disposalByVolume,
        _delay=_build_delay_properties(multi_dispense_properties.delay),
    )
