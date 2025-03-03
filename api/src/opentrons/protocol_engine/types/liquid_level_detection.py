"""Protocol Engine types to do with liquid level detection."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Union, Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    field_serializer,
    PlainSerializer,
    BeforeValidator,
)


from opentrons.types import LiquidTrackingType


def serialize_liquid_tracking_type(
    tracking_val: Union[LiquidTrackingType, None]
) -> Union[str, float, None]:
    if not tracking_val:
        return None
    if isinstance(tracking_val, float):
        return tracking_val
    else:
        return "SimulatedProbeType"


liquidInfo = Annotated[
    Union[LiquidTrackingType, None],
    PlainSerializer(
        serialize_liquid_tracking_type, return_type=Union[str, float, None]
    ),
    BeforeValidator(serialize_liquid_tracking_type, json_schema_input_type=str),
]


class LoadedVolumeInfo(BaseModel):
    """A well's liquid volume, initialized by a LoadLiquid, updated by Aspirate and Dispense."""

    volume: liquidInfo = None
    last_loaded: datetime
    operations_since_load: int

    # @field_serializer("volume")
    # def serialize_volume(
    #     self, volume: Union[LiquidTrackingType, None], _info
    # ) -> Union[str, float, None]:
    #     if not volume:
    #         return None  # have to add this to all the serialize functions
    #     if isinstance(volume, float):
    #         return volume
    #     else:
    #         return "SimulatedProbeResult"


class ProbedHeightInfo(BaseModel):
    """A well's liquid height, initialized by a LiquidProbe, cleared by Aspirate and Dispense."""

    height: liquidInfo = None
    last_probed: datetime

    # @field_serializer("height")
    # def serialize_height(
    #     self, height: Union[LiquidTrackingType, None], _info
    # ) -> Union[str, float, None]:
    #     if not height:
    #         return None
    #     if isinstance(height, float):
    #         return height
    #     else:
    #         return "SimulatedProbeResult"


class ProbedVolumeInfo(BaseModel):
    """A well's liquid volume, initialized by a LiquidProbe, updated by Aspirate and Dispense."""

    volume: liquidInfo = None
    last_probed: datetime
    operations_since_probe: int

    # @field_serializer("volume")
    # def serialize_volume(
    #     self, volume: Union[LiquidTrackingType, None], _info
    # ) -> Union[str, float, None]:
    #     if not volume:
    #         return None
    #     if isinstance(volume, float):
    #         return volume
    #     else:
    #         return "SimulatedProbeResult"


class WellInfoSummary(BaseModel):
    """Payload for a well's liquid info in StateSummary."""

    labware_id: str
    well_name: str
    loaded_volume: Optional[float] = None
    probed_height: liquidInfo = None
    probed_volume: liquidInfo = None

    # @field_serializer("probed_volume")
    # def serialize_probed_volume(
    #     self, probed_volume: Union[LiquidTrackingType, None], _info
    # ) -> Union[str, float, None]:
    #     if not probed_volume:
    #         return None
    #     if isinstance(probed_volume, float):
    #         return probed_volume
    #     else:
    #         return "SimulatedProbeResult"
    #
    # @field_serializer("probed_height")
    # def serialize_probed_height(
    #     self, probed_height: Union[LiquidTrackingType, None], _info
    # ) -> Union[str, float, None]:
    #     if not probed_height:
    #         return None
    #     if isinstance(probed_height, float):
    #         return probed_height
    #     else:
    #         return "SimulatedProbeResult"


@dataclass
class WellLiquidInfo:
    """Tracked and sensed information about liquid in a well."""

    probed_height: Optional[ProbedHeightInfo]
    loaded_volume: Optional[LoadedVolumeInfo]
    probed_volume: Optional[ProbedVolumeInfo]
