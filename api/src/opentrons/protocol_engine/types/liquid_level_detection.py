"""Protocol Engine types to do with liquid level detection."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Union

from pydantic import BaseModel

from opentrons.types import LiquidTrackingType


class LoadedVolumeInfo(BaseModel):
    """A well's liquid volume, initialized by a LoadLiquid, updated by Aspirate and Dispense."""

    volume: Optional[LiquidTrackingType] = None
    last_loaded: datetime
    operations_since_load: int


class ProbedHeightInfo(BaseModel):
    """A well's liquid height, initialized by a LiquidProbe, cleared by Aspirate and Dispense."""

    height: Union[LiquidTrackingType, None] = None
    last_probed: datetime


class ProbedVolumeInfo(BaseModel):
    """A well's liquid volume, initialized by a LiquidProbe, updated by Aspirate and Dispense."""

    volume: Union[LiquidTrackingType, None] = None
    last_probed: datetime
    operations_since_probe: int


class WellInfoSummary(BaseModel):
    """Payload for a well's liquid info in StateSummary."""

    labware_id: str
    well_name: str
    loaded_volume: Optional[float] = None
    probed_height: Union[LiquidTrackingType, None] = None
    probed_volume: Union[LiquidTrackingType, None] = None


@dataclass
class WellLiquidInfo:
    """Tracked and sensed information about liquid in a well."""

    probed_height: Optional[ProbedHeightInfo]
    loaded_volume: Optional[LoadedVolumeInfo]
    probed_volume: Optional[ProbedVolumeInfo]
