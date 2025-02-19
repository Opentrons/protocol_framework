"""Test Door Switch."""


from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from hardware_testing.opentrons_api import helpers_ot3
from opentrons.hardware_control.modules import FlexStacker
from opentrons.drivers.flex_stacker.types import HardwareRevision


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("close-door", [CSVResult]),
        CSVLine("open-door", [CSVResult]),
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
    ui.print_header("Close Door")
    if not simulate:
        ui.get_user_ready("Close the hopper door")
    await module._reader.get_door_closed()
    closed = module._reader.hopper_door_closed
    report(section, "close-door", [CSVResult.from_bool(closed)])

    ui.print_header("Open Door")
    if not simulate:
        ui.get_user_ready("Open the hopper door")
    await module._reader.get_door_closed()
    closed = module._reader.hopper_door_closed
    report(section, "open-door", [CSVResult.from_bool(not closed)])
