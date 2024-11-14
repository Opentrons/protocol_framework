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
from .common import expand_for_volume_constraints, TransferTipPolicyV2
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


def get_transfer_steps(
    aspirate_properties: AspirateProperties,
    single_dispense_properties: SingleDispenseProperties,
    volume: float,
    source: AdvancedLiquidHandling,
    dest: AdvancedLiquidHandling,
    trash_location: Union[types.Location, TrashBin, WasteChute],
    new_tip: TransferTipPolicyV2,
) -> Generator[TransferStep, None, None]:
    """Return the PAPI function steps to perform for this transfer."""
    # TODO: check for valid volume params of disposal vol, air gap and max volume
