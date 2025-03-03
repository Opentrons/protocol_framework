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
TEST_CURRENTS = [1.5, 1.25, 1.0, 0.85, 0.7, 0.5, 0.3]
CURRENT_THRESHOD = 1.0
TEST_TRIALS = 10
TEST_DIRECTIONS = [Direction.RETRACT, Direction.EXTEND]

AXIS_TRAVEL = 138  # 136 for DVT
BOTTOM_OFFSET = 10
TOP_OFFSET = 1.75
LIMIT_SWICH_CHECK = 0.5


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

    # move at homing speed off of the springs at the bottom
    await stacker.move_axis(
        TEST_AXIS, Direction.EXTEND, BOTTOM_OFFSET, HOME_SPEED, None, HOME_CURRENT
    )

    try:
        # moving at the testing speed and current to just under the limit switch
        extend_distance = AXIS_TRAVEL - BOTTOM_OFFSET
        await stacker.move_axis(
            TEST_AXIS, Direction.EXTEND, extend_distance, speed, None, current
        )

        # move towards slightly past the limit switch
        check_distance = TOP_OFFSET + LIMIT_SWICH_CHECK
        await stacker.move_axis(
            TEST_AXIS, Direction.EXTEND, check_distance, HOME_SPEED, None, HOME_CURRENT
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
        # rehome the axis at the top
        await stacker.move_axis(
            TEST_AXIS, Direction.RETRACT, TOP_OFFSET, HOME_SPEED, None, HOME_CURRENT
        )
        await stacker.home_axis(TEST_AXIS, Direction.EXTEND)

        # moving at the testing speed and current to just above the springs
        retract_distance = (AXIS_TRAVEL + TOP_OFFSET) - BOTTOM_OFFSET
        await stacker.move_axis(
            TEST_AXIS, Direction.RETRACT, retract_distance, speed, None, current
        )

        # move slightly past the limit switch
        check_distance = BOTTOM_OFFSET + LIMIT_SWICH_CHECK
        await stacker.move_axis(
            TEST_AXIS, Direction.RETRACT, check_distance, HOME_SPEED, None, HOME_CURRENT
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
                    ui.print_error(
                        f"Z Axis extend failed at speed {speed} mm/s, current {current} A"
                    )
                    failures += 1
                    continue

                # Test extend direction
                retract = await test_retract_cycle(stacker, speed, current)
                if not retract:
                    ui.print_error(
                        f"Z Axis retract failed at speed {speed} mm/s, current {current} A"
                    )
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
                    f"Z Axis failed at speed {speed} mm/s, current {current} A"
                )
                return
