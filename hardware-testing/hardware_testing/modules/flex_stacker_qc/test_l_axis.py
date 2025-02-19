"""Test L Axis."""
from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

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
        CSVLine("trigger-latch-switch", [CSVResult]),
        CSVLine("release/open-latch", [CSVResult]),
        CSVLine("hold/close-latch", [CSVResult]),
    ]


async def get_latch_held_switch(module: FlexStacker) -> bool:
    """Get limit switch."""
    held_switch = await module._driver.get_limit_switch(
        StackerAxis.L, Direction.RETRACT
    )
    print("(Held Switch triggered) : ", held_switch)
    return held_switch


async def run(
    module: FlexStacker,
    report: CSVReport,
    section: str,
    simulate: bool,
    api: helpers_ot3.OT3API,
    hardware_revision: HardwareRevision,
) -> None:
    """Run."""
    if not await get_latch_held_switch(module):
        print("Switch is not triggered, try to trigger it by closing latch...")
        await module.close_latch()
        if not await get_latch_held_switch(module):
            print("!!! Held switch is still not triggered !!!")
            report(section, "trigger-latch-switch", [CSVResult.FAIL])
            return

    report(section, "trigger-latch-switch", [CSVResult.PASS])

    ui.print_header("Latch Release/Open")
    await module.open_latch()
    success = not await get_latch_held_switch(module)
    report(section, "release/open-latch", [CSVResult.from_bool(success)])

    ui.print_header("Latch Hold/Close")
    if not success:
        print("Latch must be open to close it")
        report(section, "hold/close-latch", [CSVResult.FAIL])
    else:
        await module.close_latch()
        success = await get_latch_held_switch(module)
        report(section, "hold/close-latch", [CSVResult.from_bool(success)])
