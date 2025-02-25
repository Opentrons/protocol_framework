"""Test X Axis."""
from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .driver import FlexStackerInterface as FlexStacker, FlexStackerStallError
from opentrons.drivers.flex_stacker.driver import STACKER_MOTION_CONFIG
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction


TEST_SPEEDS = [150, 165]
TEST_CURRENTS = [1.5, 1.25, 1.0, 0.7, 0.5, 0.3, 0.2, 0.1]
CURRENT_THRESHOD = 0.7
TEST_TRIALS = 10
TEST_DIRECTIONS = [Direction.RETRACT, Direction.EXTEND]

TEST_AXIS = StackerAxis.Z
HOME_SPEED = STACKER_MOTION_CONFIG[TEST_AXIS]["home"].max_speed
HOME_CURRENT = STACKER_MOTION_CONFIG[TEST_AXIS]["home"].current


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(
            f"speed-{speed}-current-{current}-success-failed-pass%",
            [int, int, float, CSVResult],
        )
        for speed in TEST_SPEEDS
        for current in TEST_CURRENTS
    ]


async def test_extend_cycle(
    stacker: FlexStacker,
    speed: int,
    current: float,
) -> bool:
    """Test one extend cycle."""
    # first home in the opposite direction
    await stacker.home_axis(TEST_AXIS, Direction.RETRACT)
    # move at homing speed
    await stacker.move_axis(
        TEST_AXIS, Direction.EXTEND, 10, HOME_SPEED, None, HOME_CURRENT
    )
    try:
        # moving at the testing speed and current
        await stacker.move_axis(TEST_AXIS, Direction.EXTEND, 126, speed, None, current)
        # move towards limit switch
        await stacker.move_axis(
            TEST_AXIS, Direction.EXTEND, 2.25, HOME_SPEED, None, HOME_CURRENT
        )
        # check if limit switch is triggered
        success = await stacker._driver.get_limit_switch(TEST_AXIS, Direction.EXTEND)
    except FlexStackerStallError:
        return False
    return success


async def test_retract_cycle(
    stacker: FlexStacker,
    speed: int,
    current: float,
) -> bool:
    """Test one retract cycle."""
    try:
        # moving at the testing speed and current
        await stacker.move_axis(TEST_AXIS, Direction.RETRACT, 126, speed, None, current)
        # move towards limit switch
        await stacker.move_axis(
            TEST_AXIS, Direction.RETRACT, 10.5, HOME_SPEED, None, HOME_CURRENT
        )
        # check if limit switch is triggered
        success = await stacker._driver.get_limit_switch(TEST_AXIS, Direction.RETRACT)
    except FlexStackerStallError:
        return False
    return success


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    for speed in TEST_SPEEDS:
        for current in TEST_CURRENTS:
            ui.print_header(f"Z Speed: {speed} mm/s, Current: {current} A")
            trial = 0
            failures = 0
            while trial < TEST_TRIALS:
                # Test extend direction first
                extend = await test_extend_cycle(stacker, speed, current)
                trial += 1
                if not extend:
                    failures += 1
                    continue

                # Test extend direction
                retract = await test_retract_cycle(stacker, speed, current)
                if not retract:
                    failures += 1

            success_trials = trial - failures
            success_rate = (1 - failures / trial) * 100
            if current >= CURRENT_THRESHOD:
                # If current is above threshold, all trials must pass
                result = CSVResult.from_bool(success_rate == 100.0)
            else:
                result = CSVResult.PASS
            report(
                section,
                f"speed-{speed}-current-{current}-success-failed-pass%",
                [success_trials, failures, success_rate, result],
            )

            # Stop the test if any trial fails
            if result == CSVResult.FAIL:
                ui.print_error(
                    f"X Axis failed at speed {speed} mm/s, current {current} A"
                )
                return
