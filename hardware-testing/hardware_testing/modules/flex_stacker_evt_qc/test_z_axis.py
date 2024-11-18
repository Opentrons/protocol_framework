"""Test Z Axis."""
from typing import List, Tuple, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .driver import FlexStacker, StackerAxis, Direction, MoveParams


class LimitSwitchError(Exception):
    """Limit Switch Error."""

    pass


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("initial-limit-switches", [bool, bool, CSVResult]),
        CSVLine("positive-switch-triggered-at-default", [bool]),
        CSVLine("positive-switch-untriggered", [CSVResult]),
        CSVLine("trigger-positive-switch", [CSVResult]),
        CSVLine("negative-switch-triggered-at-default", [bool]),
        CSVLine("negative-switch-untriggered", [CSVResult]),
        CSVLine("trigger-negative-switch", [CSVResult]),
    ]


def get_limit_switches(driver: FlexStacker) -> Tuple[bool, bool]:
    """Get limit switches."""
    z_extent = driver.get_limit_switch(StackerAxis.Z, Direction.EXTENT)
    z_retract = driver.get_limit_switch(StackerAxis.Z, Direction.RETRACT)
    print("(Switch triggered) Positive: ", z_extent, "; Negative: ", z_retract)
    return z_extent, z_retract


def test_limit_switch(
    driver: FlexStacker, direction: Direction, report: CSVReport, section: str, tag: str
) -> None:
    """Sequence to test the limit switch for one direction."""
    triggered = get_limit_switches(driver)[direction.value]

    if triggered:
        print(
            "Limit switch already triggered, moving in opposite direction to untrigger..."
        )
        report(section, f"{tag}-switch-triggered-at-default", [True])
        driver.move_in_mm(
            StackerAxis.Z, 10 * (-1 if direction == Direction.EXTENT else 1)
        )

        triggered = get_limit_switches(driver)[direction.value]
        if triggered:
            print("!!! Limit switch still triggered !!!")
            report(section, f"{tag}-switch-untriggered", [CSVResult.FAIL])
            return

    report(section, f"{tag}-switch-untriggered", [CSVResult.PASS])

    print("Move to limit switch at speed: 50 mm/s")
    driver.move_to_limit_switch(StackerAxis.Z, direction, MoveParams(max_speed=50))
    triggered = driver.get_limit_switch(StackerAxis.Z, direction)
    print(f"Limit switch triggered: {triggered}")

    report(section, f"trigger-{tag}-switch", [CSVResult.from_bool(triggered)])


def report_limit_switches(
    driver: FlexStacker, report: CSVReport, section: str, tag: str
) -> bool:
    """Report limit switch states."""
    lw_plus, lw_minus = get_limit_switches(driver)
    if lw_plus and lw_minus:
        print("!!! Limit switches cannot be both triggered !!!")
        success = False
    else:
        success = True

    report(section, tag, [lw_plus, lw_minus, CSVResult.from_bool(success)])
    return success


def run(driver: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    ui.print_header("Initial Limit Switch States")
    report_limit_switches(driver, report, section, "initial-limit-switches")

    ui.print_header("Test Z+ Limit Switch")
    test_limit_switch(driver, Direction.EXTENT, report, section, "positive")

    ui.print_header("Test Z- Limit Switch")
    test_limit_switch(driver, Direction.RETRACT, report, section, "negative")
