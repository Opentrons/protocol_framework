"""Test X Axis."""
from typing import List, Union, Tuple
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
TEST_CURRENTS = [1.5, 1.0, 0.85, 0.7, 0.5]
CURRENT_THRESHOD = 1.0
TEST_TRIALS = 10
TEST_DIRECTIONS = [Direction.RETRACT, Direction.EXTEND]

AXIS_TRAVEL = 137  # 136 for DVT?
BOTTOM_OFFSET = 10
TOP_OFFSET = 2
LIMIT_SWICH_CHECK = 0.1
AXIS_TOLERANCE = 1
ERROR_THRESHOLD = 2


TEST_AXIS = StackerAxis.Z
HOME_SPEED = STACKER_MOTION_CONFIG[TEST_AXIS]["home"].max_speed
HOME_CURRENT = STACKER_MOTION_CONFIG[TEST_AXIS]["home"].current


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = []
    for speed in TEST_SPEEDS:
        for current in TEST_CURRENTS:
            tag = f"speed-{speed}-current-{current}"
            lines.append(
                CSVLine(f"{tag}-success-failed-pass%", [int, int, float, CSVResult])
            )
            lines.append(CSVLine(f"{tag}-extend-distance", [float] * TEST_TRIALS))
            lines.append(CSVLine(f"{tag}-retract-distance", [float] * TEST_TRIALS))
    return lines


async def test_extend_cycle(
    stacker: FlexStacker,
    speed: int,
    current: float,
) -> Tuple[bool, float]:
    """Test one extend cycle."""
    # re-home the stacker at the bottom
    await stacker.move_axis(
        TEST_AXIS, Direction.EXTEND, 4, HOME_SPEED, None, HOME_CURRENT
    )
    await stacker.home_axis(TEST_AXIS, Direction.RETRACT)

    # move at homing speed off of the springs at the bottom
    await stacker.move_axis(
        TEST_AXIS, Direction.EXTEND, BOTTOM_OFFSET, HOME_SPEED, None, HOME_CURRENT
    )
    try:
        # moving at the testing speed and current to just under the limit switch
        extend_distance = (AXIS_TRAVEL - BOTTOM_OFFSET + TOP_OFFSET - AXIS_TOLERANCE)
        await stacker.move_axis(
            TEST_AXIS, Direction.EXTEND, extend_distance, speed, None, current
        )

        dist = 0.0
        while dist <= (AXIS_TOLERANCE + ERROR_THRESHOLD):
            # move towards slightly past the limit switch
            await stacker.move_axis(
                TEST_AXIS,
                Direction.EXTEND,
                LIMIT_SWICH_CHECK,
                HOME_SPEED,
                None,
                HOME_CURRENT,
            )
            dist += LIMIT_SWICH_CHECK
            # check if limit switch is triggered
            if await stacker._driver.get_limit_switch(TEST_AXIS, Direction.EXTEND):
                # Translate dist to total movement
                dist = round((AXIS_TRAVEL + TOP_OFFSET - AXIS_TOLERANCE + dist), 2)
                ui.print_info(
                    f"Z Axis, Extend, PASS, {speed}mm/s, {current}A, {dist}mm"
                )
                return True, dist
        # Didn't hit the switch indicates stall, movement distance unknown
        dist = 0
    except FlexStackerStallError:
        ui.print_error("axis stalled!")
    return False, dist


async def test_retract_cycle(
    stacker: FlexStacker,
    speed: int,
    current: float,
) -> Tuple[bool, float]:
    """Test one retract cycle."""
    # rehome the axis at the top
    await stacker.move_axis(
        TEST_AXIS, Direction.RETRACT, 4, HOME_SPEED, None, HOME_CURRENT
    )
    await stacker.home_axis(TEST_AXIS, Direction.EXTEND)

    try:
        # moving at the testing speed and current to just above the springs
        retract_distance = (AXIS_TRAVEL + TOP_OFFSET) - BOTTOM_OFFSET
        await stacker.move_axis(
            TEST_AXIS, Direction.RETRACT, retract_distance, speed, None, current
        )

        # moving at homing speed to just above the limit switch
        retract_distance = BOTTOM_OFFSET - AXIS_TOLERANCE
        await stacker.move_axis(
            TEST_AXIS,
            Direction.RETRACT,
            retract_distance,
            HOME_SPEED,
            0,
            HOME_CURRENT
        )

        dist = 0.0
        # move in small increments towards the limit switch until we hit it
        while dist <= (AXIS_TOLERANCE + ERROR_THRESHOLD):
            # move slightly past the limit switch
            await stacker.move_axis(
                TEST_AXIS,
                Direction.RETRACT,
                LIMIT_SWICH_CHECK,
                HOME_SPEED,
                0,
                HOME_CURRENT,
            )
            dist += LIMIT_SWICH_CHECK
            # check if limit switch is triggered
            if await stacker._driver.get_limit_switch(TEST_AXIS, Direction.RETRACT):
                # Translate dist to total movement
                dist = round((AXIS_TRAVEL + TOP_OFFSET - AXIS_TOLERANCE + dist), 2)
                ui.print_info(
                    f"Z Axis, Retract, PASS, {speed}mm/s, {current}A, {dist}mm"
                )
                return True, dist
    except FlexStackerStallError:
        ui.print_error("axis stalled!")
    return False, dist


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    for speed in TEST_SPEEDS:
        for current in TEST_CURRENTS:
            tag = f"speed-{speed}-current-{current}"
            ui.print_header(f"Z Speed: {speed} mm/s, Current: {current} A")
            trial = 0
            failures = 0
            extend_data: List[float] = [None] * TEST_TRIALS
            retract_data: List[float] = [None] * TEST_TRIALS
            while trial < TEST_TRIALS:
                # Test extend direction first
                extend, dist = await test_extend_cycle(stacker, speed, current)
                extend_data[trial] = dist
                if not extend:
                    ui.print_error(
                        f"Z Axis extend failed at speed {speed} mm/s, current {current} A, Distance {dist} mm"
                    )
                    failures += 1
                    trial += 1
                    continue

                # Test extend direction
                retract, dist = await test_retract_cycle(stacker, speed, current)
                retract_data[trial] = dist
                if not retract:
                    ui.print_error(
                        f"Z Axis retract failed at speed {speed} mm/s, current {current} A, Distance {dist} mm"
                    )
                    failures += 1
                trial += 1

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
            report(section, f"{tag}-extend-distance", extend_data)
            report(section, f"{tag}-retract-distance", retract_data)

            # Stop the test if any trial fails
            if result == CSVResult.FAIL:
                ui.print_error(
                    f"Z Axis failed at speed {speed} mm/s, current {current} A"
                )
                return
    # End test in home position
    await stacker.home_axis(TEST_AXIS, Direction.RETRACT)
