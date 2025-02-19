"""Test E-Stop."""


from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from hardware_testing.opentrons_api import helpers_ot3
from opentrons.drivers.flex_stacker.types import (
    StackerAxis,
    Direction,
    HardwareRevision,
)
from opentrons.hardware_control.modules import FlexStacker
from opentrons.hardware_control.types import EstopState


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("trigger-estop", [CSVResult]),
        CSVLine("x-move-disabled", [CSVResult]),
        CSVLine("z-move-disabled", [CSVResult]),
        CSVLine("l-move-disabled", [CSVResult]),
        CSVLine("untrigger-estop", [CSVResult]),
    ]


async def axis_at_limit(module: FlexStacker, axis: StackerAxis) -> Direction:
    """Check which direction an axis is at the limit switch."""
    if axis is StackerAxis.L:
        # L axis only has one limit switch
        if await module._driver.get_limit_switch(axis, Direction.RETRACT):
            print(axis, " is at ", Direction.RETRACT, " limit switch")
            return Direction.RETRACT
    else:
        for dir in Direction:
            if await module._driver.get_limit_switch(axis, dir):
                print(axis, " is at ", dir, " limit switch")
                return dir
    raise RuntimeError(f"{axis} is not at any limit switch")


async def run(
    module: FlexStacker,
    report: CSVReport,
    section: str,
    simulate: bool,
    api: helpers_ot3.OT3API,
    hardware_revision: HardwareRevision,
) -> None:
    """Run."""
    if not simulate:
        x_limit = await axis_at_limit(module, StackerAxis.X)
        z_limit = await axis_at_limit(module, StackerAxis.Z)
        l_limit = await axis_at_limit(module, StackerAxis.L)
    else:
        x_limit = Direction.RETRACT
        z_limit = Direction.RETRACT
        l_limit = Direction.RETRACT

    ui.print_header("Trigger E-Stop")
    if not simulate:
        ui.get_user_ready("Trigger the E-Stop")

        if not api.get_estop_state() == EstopState.PHYSICALLY_ENGAGED:
            print("E-Stop is not triggered")
            report(section, "trigger-estop", [CSVResult.FAIL])
            return

    report(section, "trigger-estop", [CSVResult.PASS])

    print("Check X limit switch...")
    limit_switch_triggered = await module._driver.get_limit_switch(
        StackerAxis.X, x_limit
    )
    if limit_switch_triggered:
        report(
            section,
            "x-move-disabled",
            [CSVResult.from_bool(False)],
        )
    else:
        print("try to move X axis back to the limit switch...")
        await module.move_axis(StackerAxis.X, x_limit, 3.0)
        print("X should not move")
        report(
            section,
            "x-move-disabled",
            [
                CSVResult.from_bool(
                    not await module._driver.get_limit_switch(StackerAxis.X, x_limit)
                )
            ],
        )

    print("try to move Z axis...")
    await module.move_axis(StackerAxis.Z, z_limit.opposite(), 10.0)
    print("Z should not move")
    report(
        section,
        "z-move-disabled",
        [
            CSVResult.from_bool(
                await module._driver.get_limit_switch(StackerAxis.Z, z_limit)
            )
        ],
    )

    print("Check L limit switch...")
    limit_switch_triggered = await module._driver.get_limit_switch(
        StackerAxis.L, l_limit
    )
    if limit_switch_triggered:
        report(
            section,
            "l-move-disabled",
            [CSVResult.from_bool(False)],
        )
    else:
        print("try to move L axis back to the limit switch...")
        await module.move_axis(StackerAxis.L, l_limit, 1.0)
        print("L should not move")
        report(
            section,
            "l-move-disabled",
            [
                CSVResult.from_bool(
                    not await module._driver.get_limit_switch(StackerAxis.L, l_limit)
                )
            ],
        )

    if not simulate:
        ui.get_user_ready("Untrigger the E-Stop")
    report(
        section,
        "untrigger-estop",
        [CSVResult.from_bool(api.get_estop_state() == EstopState.DISENGAGED)],
    )
