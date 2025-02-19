"""Test Z Axis."""
from typing import List, Union
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .utils import test_limit_switches_per_direction
from opentrons.drivers.flex_stacker.types import (
    StackerAxis,
    Direction,
    HardwareRevision,
)
from opentrons.hardware_control.modules import FlexStacker
from hardware_testing.opentrons_api import helpers_ot3


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(
            "limit-switch-trigger-positive-untrigger-negative", [bool, bool, CSVResult]
        ),
        CSVLine(
            "limit-switch-trigger-negative-untrigger-positive", [bool, bool, CSVResult]
        ),
    ]


async def run(
    module: FlexStacker,
    report: CSVReport,
    section: str,
    simulate: bool,
    api: helpers_ot3.OT3API,
    hardware_revision: HardwareRevision,
) -> None:
    """Run."""
    await test_limit_switches_per_direction(
        module, StackerAxis.Z, Direction.EXTEND, report, section
    )

    await test_limit_switches_per_direction(
        module, StackerAxis.Z, Direction.RETRACT, report, section
    )
