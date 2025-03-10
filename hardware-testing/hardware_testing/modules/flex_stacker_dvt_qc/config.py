"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_connectivity,
    test_z_axis_basic,
    test_x_axis_basic,
    test_l_axis_basic,
    test_z_axis_current_speed,
    test_x_axis_current_speed,
    test_door_switch,
    test_estop,
    test_ui_leds,
    test_uv_lockout_switch,
    test_tof_basic,
)


class TestSection(enum.Enum):
    """Test Section."""

    CONNECTIVITY = "CONNECTIVITY"
    DOOR_SWITCH = "DOOR_SWITCH"
    ESTOP = "ESTOP"
    Z_AXIS_BASIC = "Z_AXIS_BASIC"
    L_AXIS_BASIC = "L_AXIS_BASIC"
    X_AXIS_BASIC = "X_AXIS_BASIC"
    UI_LEDS = "UI_LEDS"
    UV_LOCKOUT_SWITCH = "UV_LOCKOUT_SWITCH"
    Z_AXIS_CURRENT_SPEED = "Z_AXIS_CURRENT_SPEED"
    X_AXIS_CURRENT_SPEED = "X_AXIS_CURRENT_SPEED"
    TOF_BASIC = "TOF_BASIC"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.CONNECTIVITY,
        test_connectivity.run,
    ),
    (
        TestSection.Z_AXIS_BASIC,
        test_z_axis_basic.run,
    ),
    (
        TestSection.X_AXIS_BASIC,
        test_x_axis_basic.run,
    ),
    (
        TestSection.L_AXIS_BASIC,
        test_l_axis_basic.run,
    ),
    (
        TestSection.ESTOP,
        test_estop.run,
    ),
    (
        TestSection.DOOR_SWITCH,
        test_door_switch.run,
    ),
    (
        TestSection.UI_LEDS,
        test_ui_leds.run,
    ),
    (
        TestSection.UV_LOCKOUT_SWITCH,
        test_uv_lockout_switch.run,
    ),
    (
        TestSection.Z_AXIS_CURRENT_SPEED,
        test_z_axis_current_speed.run,
    ),
    (
        TestSection.X_AXIS_CURRENT_SPEED,
        test_x_axis_current_speed.run,
    ),
    (
        TestSection.TOF_BASIC,
        test_tof_basic.run,
    ),
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.CONNECTIVITY.value,
                lines=test_connectivity.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.ESTOP.value,
                lines=test_estop.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.DOOR_SWITCH.value,
                lines=test_door_switch.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.Z_AXIS_BASIC.value,
                lines=test_z_axis_basic.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.X_AXIS_BASIC.value,
                lines=test_x_axis_basic.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.L_AXIS_BASIC.value,
                lines=test_l_axis_basic.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.UI_LEDS.value,
                lines=test_ui_leds.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.UV_LOCKOUT_SWITCH.value,
                lines=test_uv_lockout_switch.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.Z_AXIS_CURRENT_SPEED.value,
                lines=test_z_axis_current_speed.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.X_AXIS_CURRENT_SPEED.value,
                lines=test_x_axis_current_speed.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.TOF_BASIC.value,
                lines=test_tof_basic.build_csv_lines(),
            ),
        ],
    )
