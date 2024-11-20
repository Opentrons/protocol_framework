"""Steps builder for transfer, consolidate and distribute using liquid class."""
from __future__ import annotations
from dataclasses import (
    dataclass,
)
from typing import (
    Optional,
    Dict,
    Any,
    Sequence,
    Union,
    TYPE_CHECKING,
    List,
    Iterator,
)

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference, Coordinate
)

from opentrons.protocol_api._liquid_properties import (
    AspirateProperties,
    SingleDispenseProperties,
    DelayProperties,
    TouchTipProperties,
    BlowoutProperties,
)
from opentrons import types
from opentrons.types import NozzleMapInterface
from .common import (
    TransferTipPolicyV2,
    expand_for_volume_constraints,
    check_valid_volume_parameters,
)

if TYPE_CHECKING:
    from opentrons.protocol_api import TrashBin, WasteChute, Well, Labware

# AdvancedLiquidHandling = Union[
#     Well,
#     types.Location,
#     Sequence[Union[Well, types.Location]],
#     Sequence[Sequence[Well]],
# ]


@dataclass
class PipetteAndTipStateInfo:
    max_volume: float
    pipette_channels: int
    nozzle_configuration: NozzleMapInterface


@dataclass
class TransferStep:
    method: str
    kwargs: Optional[Dict[str, Any]]


@dataclass
class BaseKwargs:
    ...

    def dict(self) -> Dict[str, Any]:
        """As dictionary"""
        return self.__dict__


@dataclass
class MoveToArgs(BaseKwargs):
    location: types.Location
    speed: Optional[float]


@dataclass
class DelayArgs(BaseKwargs):
    seconds: float


@dataclass
class PickUpTipArgs(BaseKwargs):
    location: Union[types.Location, Well, Labware, None]
    presses: None = None
    increment: None = None
    prep_after: bool = True


@dataclass
class DropTipArgs(BaseKwargs):
    location: Optional[
            Union[
                types.Location,
                Well,
                TrashBin,
                WasteChute,
            ]
        ] = None,
    home_after: bool = True


@dataclass
class MixArgs(BaseKwargs):
    repetitions: int = 1
    volume: None = None
    location: None = None
    rate: float = 1


class ComplexCommandBuilder:
    """Builder for transfer/ distribute/ consolidate steps."""

    def __init__(self) -> None:
        """Initialize complex command builder."""
        self._aspirate_steps_builder = AspirateStepsBuilder()

    def build_transfer_steps(
        self,
        aspirate_properties: AspirateProperties,
        single_dispense_properties: SingleDispenseProperties,
        volume: float,
        source: Sequence[Well],
        dest: Sequence[Well],
        trash_location: Union[types.Location, TrashBin, WasteChute],
        new_tip: TransferTipPolicyV2,
        instrument_info: PipetteAndTipStateInfo,
    ) -> Iterator[TransferStep]:
        """Build steps for the transfer and return an iterator for them."""
        check_valid_volume_parameters(
            disposal_volume=0,  # No disposal volume for 1-to-1 transfer
            air_gap=aspirate_properties.retract.air_gap_by_volume.get_for_volume(volume),
            max_volume=instrument_info.max_volume,
        )
        source_dest_per_volume_step = expand_for_volume_constraints(
            volumes=[volume for _ in range(len(source))],
            targets=zip(source, dest),
            max_volume=instrument_info.max_volume
        )
        if new_tip == TransferTipPolicyV2.ONCE:
            yield TransferStep(
                method="pick_up_tip",
                kwargs=PickUpTipArgs(location=None).dict()
            )
        for step_volume, (src, dest) in source_dest_per_volume_step:
            if new_tip == TransferTipPolicyV2.ALWAYS:
                yield TransferStep(
                    method="pick_up_tip",
                    kwargs=PickUpTipArgs(location=None).dict()
                )
            yield from self._aspirate_steps_builder.build_aspirate_steps(
                source=src,
                aspirate_properties=aspirate_properties
            )
            # TODO: add dispense step builder
            if new_tip == TransferTipPolicyV2.ALWAYS:
                yield TransferStep(
                    method="drop_tip",
                    kwargs=DropTipArgs(location=trash_location).dict()
                )


class AspirateStepsBuilder:
    """Builder for all steps associated with aspiration."""

    def __init__(self) -> None:
        """Initialize AspirateStepsBuilder."""
        self._submerge_steps_builder = SubmergeStepsBuilder()
        self._retract_steps_builder = RetractStepsBuilder()

    def build_aspirate_steps(
        self,
        source: Well,
        aspirate_properties: AspirateProperties,
    ) -> Iterator[TransferStep]:
        """Build steps associated with aspiration."""
        yield self._submerge_steps_builder.build_submerge_steps(
            target_well=source,
            position_reference=aspirate_properties.submerge.position_reference,
            offset=aspirate_properties.submerge.offset,
            speed=aspirate_properties.submerge.speed,
            delay=aspirate_properties.submerge.delay,
        )
        if aspirate_properties.mix.enabled:
            yield TransferStep(
                method="mix",
                kwargs=MixArgs(
                    repetitions=aspirate_properties.mix.repetitions,
                    volume=aspirate_properties.mix.volume,
                ).dict()
            )
        if aspirate_properties.pre_wet



class SubmergeStepsBuilder:
    """Class for building submerge steps."""

    def __init__(self) -> None:
        """Initialize SubmergeStepsBuilder."""
        pass

    def build_submerge_steps(
        self,
        target_well: Well,
        position_reference: PositionReference,
        offset: Coordinate,
        speed: float,
        delay: DelayProperties,
    ) -> Iterator[TransferStep]:
        """Build steps associated with submerging the pipette."""
        # Move to top of well
        yield TransferStep(
            method="move_to",
            kwargs=MoveToArgs(location=target_well.top(), speed=None).dict()
        )

        # Move to submerge position inside well at given speed
        offset_point = types.Point(offset.x, offset.y, offset.z)
        if position_reference == PositionReference.WELL_TOP:
            well_position = target_well.top().move(offset_point)
        elif position_reference == PositionReference.WELL_BOTTOM:
            well_position = target_well.bottom().move(offset_point)
        elif position_reference == PositionReference.WELL_CENTER:
            well_position = target_well.center().move(offset_point)
        else:
            raise NotImplementedError(
                "Only position reference of WELL_TOP, WELL_BOTTOM and WELL_CENTER is implemented."
            )
        yield TransferStep(
            method="move_to",
            kwargs=MoveToArgs(location=well_position, speed=speed).dict(),
        )
        # Delay
        if delay.enabled:
            yield TransferStep(
                method="_delay",
                kwargs=DelayArgs(seconds=delay.duration).dict()
            )


class RetractStepsBuilder:
    """Class for building retraction steps."""

    def __init__(self) -> None:
        """Initialize RetractStepsBuilder."""
        pass

    def build_retract_steps(
        self,
        position_reference: PositionReference,
        offset: Coordinate,
        speed: float,
        delay: DelayProperties,
        air_gap: float,
        touch_tip: TouchTipProperties,
        blow_out: Optional[BlowoutProperties],
    ) -> Iterator[TransferStep]:
        """Build steps associated with retracting the pipette."""
        pass
