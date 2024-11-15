"""Steps builder for transfer, consolidate and distribute using liquid class."""
import dataclasses
from typing import (
    Optional,
    Dict,
    Any,
    Sequence,
    Union,
    TYPE_CHECKING,
)

from opentrons.protocol_api._liquid_properties import (
    AspirateProperties,
    SingleDispenseProperties,
)
from opentrons import types
from .common import TransferTipPolicyV2

# from opentrons.protocol_api.labware import Labware, Well
#
if TYPE_CHECKING:
    from opentrons.protocol_api import TrashBin, WasteChute, Well, Labware
#
# AdvancedLiquidHandling = Union[
#     Well,
#     types.Location,
#     Sequence[Union[Well, types.Location]],
#     Sequence[Sequence[Well]],
# ]


@dataclasses.dataclass
class TransferStep:
    method: str
    kwargs: Optional[Dict[str, Any]]


def get_transfer_steps(
    aspirate_properties: AspirateProperties,
    single_dispense_properties: SingleDispenseProperties,
    volume: float,
    source: Sequence[Union[Well, types.Location]],
    dest: Sequence[Union[Well, types.Location]],
    trash_location: Union[Labware, types.Location, TrashBin, WasteChute],
    new_tip: TransferTipPolicyV2,
) -> None:
    """Return the PAPI function steps to perform for this transfer."""
    # TODO: check for valid volume params of disposal vol, air gap and max volume
