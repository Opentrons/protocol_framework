"""Steps builder for transfer, consolidate and distribute using liquid class."""
import dataclasses
from typing import (
    TYPE_CHECKING,
    Union,
    Sequence,
    Optional,
    Dict,
    Any,
    Generator,
    Literal,
)

from opentrons.protocol_api._liquid_properties import (
    AspirateProperties,
    SingleDispenseProperties,
    MultiDispenseProperties,
)
from opentrons import types
from .common import expand_for_volume_constraints
from opentrons.protocol_api.labware import Labware, Well

if TYPE_CHECKING:
    from opentrons.protocol_api import LiquidClass, TrashBin, WasteChute

AdvancedLiquidHandling = Union[
    Well,
    types.Location,
    Sequence[Union[Well, types.Location]],
    Sequence[Sequence[Well]],
]


@dataclasses.dataclass
class TransferStep:
    method: str
    kwargs: Optional[Dict[str, Any]]


# def get_transfer_steps(
#     aspirate_properties: AspirateProperties,
#     single_dispense_properties: SingleDispenseProperties,
#     multi_dispense_properties: MultiDispenseProperties,
#     volume: float,
#     source: AdvancedLiquidHandling,
#     dest: AdvancedLiquidHandling,
#     trash_location: Union[types.Location, TrashBin, WasteChute] = True,
#     new_tip: Optional[Literal["once", "always", "never"]] = "once",
# ) -> Generator[TransferStep, None, None]:
#     """Return the PAPI function steps to perform for this transfer."""
#     # TODO: check for valid volume params of disposal vol, air gap and max volume

# _transfer_steps_for_aspirate(
#     asp_properties=aspirate_properties,
#     volume=volume,
#     transfers=transfers,
# )
# self._transfer_steps_for_single_dispense(
#     liquid_class=pe_liquid_class,
#     volume=volume,
#     transfers=transfers,
# )


# def _transfer_steps_for_aspirate(
#     asp_properties: AspirateProperties,
#     volume: float,
#     transfers: List[SingleTransfer],
# ) -> None:
#     """Perform pre-aspirate steps, aspirate and post-aspiration steps.
#     Sequence:
#         1. Submerge
#         2. Delay (optional)
#         3. Pre-wet (optional)
#         4. Mix (optional)
#         5. Aspirate
#         6. Delay (optional)
#         7. Retract
#         8. Delay (optional)
#         9. Touch tip (optional)
#         10. Air gap (optional)
#     """
# for transfer in transfers:
#     if transfer.pick_up_tip.pick_up_new:
#         self._engine_client.execute_command(
#             cmd.PickUpTipParams(..., liquidClassId=liquid_class.id)
#         )
#
#     # Submerge
#     # ------------
#     # Drawback of using the existing move-to command is that there's no good way
#     # to differentiate between the different move-to's to have the run log show
#     # that it's a submerge step or retract step
#     self._engine_client.execute_command(
#         cmd.MoveToWellParams(
#             pipetteId=self._pipette_id,
#             labwareId=transfer.source_well.labware_id,
#             wellName=transfer.source_well.get_name(),
#             wellLocation="<get well location from well core + submerge params>",
#             speed=asp_properties.submerge.speed,
#             liquidClassId=liquid_class.id,
#         )
#     )
#     # Post-submerge delay
#     if asp_properties.submerge.delay.enable:
#         self._engine_client.execute_command(
#             cmd.WaitForDurationParams(
#                 seconds=asp_properties.submerge.delay.params.duration,
#                 liquidClassId=liquid_class.id,
#                 # hmm.. adding a liquid class id to a wait for feels kinda weird
#             )
#         )
#     # Pre-wet
#     if asp_properties.preWet:
#         self._engine_client.execute_command(
#             cmd.AspirateParams(
#                 ..., liquidClassId=liquid_class.id
#             )  # use same vol as transfer volume
#         )
#     # Mix
#     # -----
#     # Similar drawback as noted in 'submerge' - can't show that this
#     # aspirate-dispense combo step is a part of a mix
#     if asp_properties.mix.enable:
#         for _ in range(asp_properties.mix.params.repetitions):
#             self._engine_client.execute_command(
#                 cmd.AspirateParams(
#                     pipetteId=self._pipette_id,
#                     volume=asp_properties.mix.params.volume,
#                     flowRate=asp_properties.flowRateByVolume.get(volume),
#                     # This will need to provide interpolated/ extrapolated value for the volume in question
#                     labwareId=transfer.source_well.labware_id,
#                     wellName=transfer.source_well.get_name(),
#                     wellLocation="<get well location from well core + aspirate well offset? >",
#                     # find out which well location to use for mix
#                     liquidClassId=liquid_class.id,
#                 )
#             )
#             self._engine_client.execute_command(
#                 cmd.DispenseParams(
#                     pipetteId=self._pipette_id,
#                     volume=asp_properties.mix.params.volume,
#                     flowRate=liquid_class.singleDispenseProperties.flowRateByVolume.get(
#                         volume
#                     ),
#                     # This will need to provide interpolated/ extrapolated value for the volume in question
#                     labwareId=transfer.source_well.labware_id,
#                     wellName=transfer.source_well.get_name(),
#                     wellLocation="<get well location from well core + aspirate well offset? >",
#                     # find out which well location to use for mix
#                     liquidClassId=liquid_class.id,
#                 )
#             )
#     # Aspirate
#     self._engine_client.execute_command(
#         cmd.AspirateParams(
#             pipetteId=self._pipette_id,
#             volume=volume,
#             flowRate=asp_properties.flowRateByVolume.get(volume),
#             # This will need to provide interpolated/ extrapolated value for the volume in question
#             labwareId=transfer.source_well.labware_id,
#             wellName=transfer.source_well.get_name(),
#             wellLocation="<get well location from well core + aspirate well offset >",
#             liquidClassId=liquid_class.id,
#         )
#     )
#     # Post-aspirate delay
#     if asp_properties.delay.enable:
#         self._engine_client.execute_command(
#             cmd.WaitForDurationParams(
#                 seconds=asp_properties.delay.params.duration,
#                 liquidClassId=liquid_class.id,
#             )
#         )
#     # Post-aspirate retract
#     self._engine_client.execute_command(
#         cmd.MoveToWellParams(
#             pipetteId=self._pipette_id,
#             labwareId=transfer.source_well.labware_id,
#             wellName=transfer.source_well.get_name(),
#             wellLocation="<get well location from well core + retract params>",
#             speed=asp_properties.retract.speed,
#             liquidClassId=liquid_class.id,
#         )
#     )
#     # Post-aspirate touch tip
#     if asp_properties.retract.touchTip.enable:
#         self._engine_client.execute_command(
#             cmd.TouchTipParams(
#                 pipetteId=self._pipette_id,
#                 labwareId=transfer.source_well.labware_id,
#                 wellName=transfer.source_well.get_name(),
#                 wellLocation=transfer.source_well.get_top(
#                     z_offset=asp_properties.retract.touchTip.params.zOffset
#                 ),
#                 mmToEdge=asp_properties.retract.touchTip.params.mmToEdge,  # anticipated new param to touch tip command
#                 speed=asp_properties.retract.touchTip.params.speed,
#                 liquidClassId=liquid_class.id,
#             )
#         )
#     # Post-retract delay
#     if asp_properties.retract.delay.enable:
#         self._engine_client.execute_command(
#             cmd.WaitForDurationParams(
#                 seconds=asp_properties.retract.delay.params.duration,
#                 liquidClassId=liquid_class.id,
#             )
#         )
#     # Post-retract air gap
#     self._engine_client.execute_command(
#         cmd.AspirateInPlaceParams(
#             pipetteId=self._pipette_id,
#             volume=asp_properties.retract.airGapByVolume(volume),
#             flowRate=asp_properties.flowRateByVolume.get(
#                 volume
#             ),  # This will need to provide interpolated/ extrapolated value for the volume in question
#             liquidClassId=liquid_class.id,
#         )
#     )
