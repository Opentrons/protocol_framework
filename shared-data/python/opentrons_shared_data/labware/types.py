""" opentrons_shared_data.labware.types: types for labware defs

types in this file by and large require the use of typing_extensions.
this module shouldn't be imported unless typing.TYPE_CHECKING is true.
"""
from typing import NewType
from typing_extensions import Literal, TypedDict, NotRequired
from .labware_definition import InnerWellGeometry
from .constants import (
    CircularType,
    RectangularType,
)

LabwareUri = NewType("LabwareUri", str)

LabwareDisplayCategory = Literal[
    "tipRack",
    "tubeRack",
    "reservoir",
    "trash",
    "wellPlate",
    "aluminumBlock",
    "adapter",
    "other",
    "lid",
    "system",
]

LabwareFormat = Literal[
    "96Standard",
    "384Standard",
    "trough",
    "irregular",
    "trash",
]

LabwareRoles = Literal[
    "labware",
    "fixture",
    "adapter",
    "maintenance",
    "lid",
    "system",
]


class Vector(TypedDict):
    x: float
    y: float
    z: float


class GripperOffsets(TypedDict):
    pickUpOffset: Vector
    dropOffset: Vector


class LabwareParameters(TypedDict):
    format: LabwareFormat
    isTiprack: bool
    loadName: str
    isMagneticModuleCompatible: bool
    isDeckSlotCompatible: NotRequired[bool]
    quirks: NotRequired[list[str]]
    tipLength: NotRequired[float]
    tipOverlap: NotRequired[float]
    magneticModuleEngageHeight: NotRequired[float]


class LabwareBrandData(TypedDict):
    brand: str
    brandId: NotRequired[list[str]]
    links: NotRequired[list[str]]


class LabwareMetadata(TypedDict):
    displayName: str
    displayCategory: LabwareDisplayCategory
    displayVolumeUnits: Literal["µL", "mL", "L"]
    tags: NotRequired[list[str]]


class LabwareDimensions(TypedDict):
    yDimension: float
    zDimension: float
    xDimension: float


class CircularWellDefinition(TypedDict):
    shape: CircularType
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    diameter: float
    geometryDefinitionId: NotRequired[str]


class RectangularWellDefinition(TypedDict):
    shape: RectangularType
    depth: float
    totalLiquidVolume: float
    x: float
    y: float
    z: float
    xDimension: float
    yDimension: float
    geometryDefinitionId: NotRequired[str | None]


WellDefinition = CircularWellDefinition | RectangularWellDefinition


class WellGroupMetadata(TypedDict):
    displayName: NotRequired[str]
    displayCategory: NotRequired[LabwareDisplayCategory]
    wellBottomShape: NotRequired[Literal["flat", "u", "v"]]


class WellGroup(TypedDict):
    wells: list[str]
    metadata: WellGroupMetadata
    brand: NotRequired[LabwareBrandData]


class LabwareDefinition(TypedDict):
    schemaVersion: Literal[2, 3]
    version: int
    namespace: str
    metadata: LabwareMetadata
    brand: LabwareBrandData
    parameters: LabwareParameters
    cornerOffsetFromSlot: Vector
    ordering: list[list[str]]
    dimensions: LabwareDimensions
    wells: dict[str, WellDefinition]
    groups: list[WellGroup]
    stackingOffsetWithLabware: NotRequired[dict[str, Vector]]
    stackingOffsetWithModule: NotRequired[dict[str, Vector]]
    allowedRoles: NotRequired[list[LabwareRoles]]
    gripperOffsets: NotRequired[dict[str, GripperOffsets]]
    gripForce: NotRequired[float]
    gripHeightFromLabwareBottom: NotRequired[float]
    innerLabwareGeometry: NotRequired[dict[str, InnerWellGeometry] | None]
    compatibleParentLabware: NotRequired[list[str]]
    stackLimit: NotRequired[int]
