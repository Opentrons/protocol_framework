"""Test X Axis."""
from typing import List, Union
from hardware_testing.data import ui
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
        CSVLine(
            "platform-sensor-trigger-positive-untrigger-negative",
            [bool, bool, CSVResult],
        ),
        CSVLine(
            "platform-sensor-trigger-negative-untrigger-positive",
            [bool, bool, CSVResult],
        ),
    ]


async def test_platform_sensors_for_direction(
    module: FlexStacker, direction: Direction, report: CSVReport, section: str
) -> None:
    """Test platform sensors for a given direction."""
    ui.print_header(f"Platform Sensor - {direction} direction")
    sensor_result = await module._driver.get_platform_sensor(direction)
    opposite_result = not await module._driver.get_platform_sensor(direction.opposite())
    print(f"{direction} sensor triggered: {sensor_result}")
    print(f"{direction.opposite()} sensor untriggered: {opposite_result}")
    report(
        section,
        f"platform-sensor-trigger-{direction}-untrigger-{direction.opposite()}",
        [
            sensor_result,
            opposite_result,
            CSVResult.from_bool(sensor_result and opposite_result),
        ],
    )


async def platform_is_removed(module: FlexStacker) -> bool:
    """Check if the platform is removed from the carrier."""
    plus_side = await module._driver.get_platform_sensor(Direction.EXTEND)
    minus_side = await module._driver.get_platform_sensor(Direction.RETRACT)
    return not plus_side and not minus_side


async def run(
    module: FlexStacker,
    report: CSVReport,
    section: str,
    simulate: bool,
    api: helpers_ot3.OT3API,
    hardware_revision: HardwareRevision,
) -> None:
    """Run."""
    if not simulate and not platform_is_removed(module):
        print("FAILURE - Cannot start tests with platform on the carrier")
        return

    await test_limit_switches_per_direction(
        module, StackerAxis.X, Direction.EXTEND, report, section
    )

    if not simulate:
        ui.get_user_ready("Place the platform on the X carrier")

    await test_platform_sensors_for_direction(module, Direction.EXTEND, report, section)

    await test_limit_switches_per_direction(
        module, StackerAxis.X, Direction.RETRACT, report, section
    )

    await test_platform_sensors_for_direction(
        module, Direction.RETRACT, report, section
    )
