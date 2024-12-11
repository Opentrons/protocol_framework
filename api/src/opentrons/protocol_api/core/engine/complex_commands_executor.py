"""Executor for liquid class based complex commands."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Union, TYPE_CHECKING

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    PositionReference,
    Coordinate,
)

from opentrons.protocol_api._liquid_properties import (
    SingleDispenseProperties,
    MultiDispenseProperties,
    Submerge,
    RetractAspirate,
    RetractDispense,
    DelayProperties,
    TransferProperties,
)
from opentrons.types import Location, Point

if TYPE_CHECKING:
    from .well import WellCore
    from .instrument import InstrumentCore


@dataclass
class _TargetPosition:
    position_reference: PositionReference
    offset: Coordinate


@dataclass
class _TargetAsLocationAndWell:
    location: Location
    well: WellCore


@dataclass
class _MixData:
    volume: float
    repetitions: int
    aspirate_flow_rate: float
    aspirate_delay: DelayProperties
    dispense_flow_rate: float
    dispense_delay: DelayProperties


class LiquidClassTransferExecutor:
    def __init__(
        self,
        instrument_core: InstrumentCore,
        transfer_properties: TransferProperties,
    ) -> None:
        self._instrument = instrument_core
        self._transfer_properties = transfer_properties

    def aspirate(
        self,
        volume: float,
        source: WellCore,
    ) -> None:
        """Execute aspiration steps.

        1. Submerge
        2. Mix
        3. pre-wet
            - 1 combo of aspirate + dispense at the same flow rate as specified in asp & disp and the delays in asp & disp
            - Use the target volume/ volume we will be aspirating
            - No push out
            - Not pre-wet for consolidation
        4. Aspirate
            - Aspirate with provided flow rate
        5. Delay- wait inside the liquid
        6. Aspirate retract
        """
        aspirate_properties = self._transfer_properties.aspirate
        dispense_properties = self._transfer_properties.dispense
        aspirate_location_and_well = _TargetAsLocationAndWell(
            location=location_from_position_reference_and_offset(
                well=source,
                position_reference=aspirate_properties.position_reference,
                offset=aspirate_properties.offset,
            ),
            well=source,
        )

        self._submerge(
            target_location_and_well=aspirate_location_and_well,
            submerge_props=aspirate_properties.submerge,
        )
        mix_props = aspirate_properties.mix
        if mix_props.enabled:
            # This would have been validated in the liquid class. Assertion only for mypy purposes
            assert mix_props.repetitions is not None and mix_props.volume is not None
            self._mix(
                target_location_and_well=aspirate_location_and_well,
                mix_data=_MixData(
                    repetitions=mix_props.repetitions,
                    volume=mix_props.volume,
                    aspirate_flow_rate=aspirate_properties.flow_rate_by_volume.get_for_volume(
                        mix_props.volume
                    ),
                    aspirate_delay=aspirate_properties.delay,
                    dispense_flow_rate=dispense_properties.flow_rate_by_volume.get_for_volume(
                        mix_props.volume
                    ),
                    dispense_delay=dispense_properties.delay,
                ),
            )
        if aspirate_properties.pre_wet:
            self._mix(
                target_location_and_well=aspirate_location_and_well,
                mix_data=_MixData(
                    repetitions=1,
                    volume=volume,
                    aspirate_flow_rate=aspirate_properties.flow_rate_by_volume.get_for_volume(
                        volume
                    ),
                    aspirate_delay=aspirate_properties.delay,
                    dispense_flow_rate=dispense_properties.flow_rate_by_volume.get_for_volume(
                        volume
                    ),
                    dispense_delay=dispense_properties.delay,
                ),
            )

        self._instrument.aspirate(
            location=aspirate_location_and_well.location,
            well_core=source,
            volume=volume,
            rate=1,
            flow_rate=aspirate_properties.flow_rate_by_volume.get_for_volume(volume),
            in_place=True,
        )
        if aspirate_properties.delay.enabled:
            asp_delay_duration = aspirate_properties.delay.duration
            # This would have been validated in the liquid class.
            # Assertion only for mypy purposes
            assert asp_delay_duration is not None
            self._instrument.delay(asp_delay_duration)
        self._retract(retract_props=aspirate_properties.retract)

    def single_dispense(
        self,
        volume: float,
        source: WellCore,
        dest: WellCore,
        dispense_properties: SingleDispenseProperties,
    ) -> None:
        """Execute single-dispense steps.

        1. Move pipette to the ‘submerge’ position with normal speed.
            - The pipette will move in an arc- move to max z height of labware (if asp & disp are in same labware) or max z height of all labware (if asp & disp are in separate labware)
        2. Air gap removal:
            - If dispense location is above the meniscus, DO NOT remove air gap (it will be dispensed along with rest of the liquid later). All other scenarios, remove the air gap by doing a dispense
            - Flow rate = min(dispenseFlowRate, (airGapByVolume)/sec)
        3. Use the post-dispense delay
        4. Move to the dispense position at the specified ‘submerge’ speed (even if we might not be moving into the liquid)
        5. Do a delay
        6. Dispense:
            - Dispense at the specified flow rate.
            - Do a push out as specified ONLY IF there is no mix following the dispense AND the tip is empty.
            Volume for push out is the volume being dispensed. So if we are dispensing 50uL, use pushOutByVolume[50] as push out volume.
        7. Delay
        8. Mix using the same flow rate and delays as specified for asp+disp, with the volume and the number of repetitions specified. Use the delays in asp & disp.
            - If the dispense position is outside the liquid, then raise error if mix is enabled.
            - If the user wants to perform a mix then they should specify a dispense position that’s inside the liquid OR do mix() on the wells after transfer.
            - Do push out at the last dispense.

        """

    def multi_dispense(self, dispense_properties: MultiDispenseProperties) -> None:
        """Execute multi-dispense steps."""

    def _submerge(
        self,
        target_location_and_well: _TargetAsLocationAndWell,
        submerge_props: Submerge,
    ) -> None:
        """Execute submerge steps.

        1. move to position shown by positionReference + offset (should practically be a point outside/above the liquid).
        Should raise an error if this point is inside the liquid?
            For liquid meniscus this is easy to tell. Can’t be below meniscus
            For reference pos of anything else, do not allow submerge position to be below aspirate position
        2. move to aspirate position at desired speed
        3. delay
        """
        # TODO: compare submerge start position and aspirate position and raise error if incompatible
        self._instrument.move_to(
            location=location_from_position_reference_and_offset(
                target_location_and_well.well,
                submerge_props.position_reference,
                submerge_props.offset,
            ),
            well_core=target_location_and_well.well,
            force_direct=False,
            minimum_z_height=None,
            speed=None,
        )
        self._instrument.move_to(
            location=target_location_and_well.location,
            well_core=target_location_and_well.well,
            force_direct=True,
            minimum_z_height=None,
            speed=submerge_props.speed,
        )
        if submerge_props.delay.enabled:
            self._instrument.delay(submerge_props.delay.duration)

    def _retract(self, retract_props: Union[RetractAspirate, RetractDispense]) -> None:
        """Execute retraction steps.

        Retract aspirate:
        1. Move TO the position reference+offset AT the specified speed
            Raise error if retract is below aspirate position or below the meniscus
        2. Delay
        3. Touch tip
            - Move to the Z offset position
            - Touch tip to the sides at the specified speed (tip moves back to the center as part of touch tip)
            - Return back to the retract position
        4. Air gap
            - Air gap volume depends on the amount of liquid in the pipette
            So if total aspirated volume is 20, use the value for airGapByVolume[20]
            Flow rate = min(aspirateFlowRate, (airGapByVolume)/sec)
        5. Use post-aspirate delay

        Retract dispense:
        1. Position ref+offset is the ending position. Move to this position using specified speed
        2. If blowout is enabled and “destination”
            - Do blow-out (at the retract position)
            - Leave plunger down
        3. Touch-tip
        4. If not ready-to-aspirate
            - Prepare-to-aspirate (at the retract position)
        5. Air-gap (at the retract position)
            - This air gap is for preventing any stray droplets from falling while moving the pipette.
                It will be performed out of caution even if we just did a blow_out and should *hypothetically*
                have no liquid left in the tip.
            - This air gap will be removed at the next aspirate.
                If this is the last step of the transfer, and we aren't dropping the tip off,
                then the air gap will be left as is(?).
        6. If blowout is “source” or “trash”
            - Move to location (top of Well)
            - Do blow-out (top of well)
            - Do touch-tip (?????) (only if it’s in a non-trash location)
            - Prepare-to-aspirate (top of well)
            - Do air-gap (top of well)
        7. If drop tip, move to drop tip location, drop tip
        """

    def _mix(
        self,
        target_location_and_well: _TargetAsLocationAndWell,
        mix_data: _MixData,
    ) -> None:
        """Execute mix steps.

        1. Use same flow rates and delays as aspirate and dispense
        2. Do [(aspirate + dispense) x repetitions] at the same position
        3. Do NOT push out at the end of dispense
        4. USE the delay property from aspirate & dispense during mix as well (flow rate and delay are coordinated with each other)
        5. Do not mix during consolidation
        NOTE: For most of our built-in definitions, we will keep _mix_ off because it is a very application specific thing.
        We should mention in our docs that users should adjust this property according to their application.
        """
        for n in range(mix_data.repetitions):
            # TODO: figure out what to set is_meniscus as
            self._instrument.aspirate(
                location=target_location_and_well.location,
                well_core=target_location_and_well.well,
                volume=mix_data.volume,
                rate=1,
                flow_rate=mix_data.aspirate_flow_rate,
                in_place=True,
                is_meniscus=None,
            )
            if mix_data.aspirate_delay.enabled:
                asp_delay_duration = mix_data.aspirate_delay.duration
                # This would have been validated in the liquid class.
                # Assertion only for mypy purposes
                assert asp_delay_duration is not None
                self._instrument.delay(asp_delay_duration)
            self._instrument.dispense(
                location=target_location_and_well.location,
                well_core=target_location_and_well.well,
                volume=mix_data.volume,
                rate=1,
                flow_rate=mix_data.dispense_flow_rate,
                in_place=True,
                push_out=None,  # TODO: check if this should be 0 instead
                is_meniscus=None,
            )
            if mix_data.dispense_delay.enabled:
                disp_delay_duration = mix_data.dispense_delay.duration
                assert disp_delay_duration is not None
                self._instrument.delay(disp_delay_duration)


def location_from_position_reference_and_offset(
    well: WellCore,
    position_reference: PositionReference,
    offset: Coordinate,
) -> Location:
    """Get position in `Location` type, given the well, the position reference and offset."""
    match position_reference:
        case PositionReference.WELL_TOP:
            reference_point = well.get_top(0)
        case PositionReference.WELL_BOTTOM:
            reference_point = well.get_bottom(0)
        case PositionReference.WELL_CENTER:
            reference_point = well.get_center()
        case PositionReference.LIQUID_MENISCUS:
            raise NotImplementedError(
                "Liquid transfer using liquid-meniscus relative positioning is not yet implemented"
            )
        case _:
            raise ValueError(f"Unknown position reference {position_reference}")
    return Location(reference_point + Point(offset.x, offset.y, offset.z), labware=None)
