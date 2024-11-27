"""Test Droplets."""
from asyncio import sleep
from time import time
from typing import List, Union, Tuple, Optional, Dict, Literal
import argparse
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.motion_utilities import target_position_from_relative
from hardware_testing.opentrons_api import types
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point, Axis
import asyncio
STALL_THRESHOLD_MM = 0.1
NUM_SECONDS_TO_WAIT = 1
HOVER_HEIGHT_MM = 50
DEPTH_INTO_RESERVOIR_FOR_ASPIRATE = -20
DEPTH_INTO_RESERVOIR_FOR_DISPENSE = DEPTH_INTO_RESERVOIR_FOR_ASPIRATE

RESERVOIR_LABWARE = "nest_1_reservoir_195ml"
PLATE_LABWARE = "corning_96_wellplate_360ul_flat"
DEFAULT_CYCLES = 65000
DEFAULT_N = 60

TIP_RACK_96_SLOT = 1
TIP_RACK_PARTIAL_SLOT = 5
RESERVOIR_SLOT = 2
PLATE_SLOT = 3
TRASH_SLOT = 12

TRASH_HEIGHT = 40  # DVT trash
TIP_RACK_96_ADAPTER_HEIGHT = 11  # DVT adapter

# X moves negative (to left), Y moves positive (to rear)
# move to same spot over labware, regardless of number of tips attached
OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)

PARTIAL_CURRENTS: Dict[int, float] = {1: 0.1, 8: 0.55, 12: 0.8, 16: 1.1, 24: 1.5}

PARTIAL_TESTS: Dict[str, Tuple[Point, float]] = {
    # test-name: [offset-from-A1, z-current]
    "1-tip-back-left": (
        Point(x=9 * 11, y=9 * 7),  # A12 Tip
        PARTIAL_CURRENTS[1],
    ),
    "8-tips-left": (
        Point(x=9 * 10),  # A11-H11 Tips
        PARTIAL_CURRENTS[8],
    ),
    "24-tips-left": (
        Point(x=9 * 7),  # A8-H10 Tips
        PARTIAL_CURRENTS[24],
    ),
}


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    all_tips_test = [CSVLine("droplets-96-tips", [float, CSVResult])]
    partial_tests = [
        CSVLine(f"droplets-{name}", [float, CSVResult]) for name in PARTIAL_TESTS.keys()
    ]
    return all_tips_test + partial_tests  # type: ignore[return-value]


def get_trash_nominal() -> Point:
    """Get nominal trash position."""
    trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
        TRASH_SLOT
    ) + Point(z=TRASH_HEIGHT)
    # center the 96ch of the 1-well labware
    trash_nominal += OFFSET_FOR_1_WELL_LABWARE
    return trash_nominal


def get_reservoir_nominal() -> Point:
    """Get nominal reservoir position."""
    reservoir_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        RESERVOIR_SLOT, RESERVOIR_LABWARE
    )
    # center the 96ch of the 1-well labware
    reservoir_a1_nominal += OFFSET_FOR_1_WELL_LABWARE
    return reservoir_a1_nominal

def get_plate_nominal() -> Point:
    """Get nominal reservoir position."""
    plate_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        PLATE_SLOT, PLATE_LABWARE
    )
    # center the 96ch of the 1-well labware
    plate_a1_nominal
    return plate_a1_nominal


def get_tiprack_96_nominal(pipette: Literal[200, 1000]) -> Point:
    """Get nominal tiprack position for 96-tip pick-up."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_96_SLOT, f"opentrons_flex_96_tiprack_{pipette}ul"
    )
    return tip_rack_a1_nominal + Point(z=TIP_RACK_96_ADAPTER_HEIGHT)


def get_tiprack_partial_nominal(pipette: Literal[200, 1000]) -> Point:
    """Get nominal tiprack position for partial-tip pick-up."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_PARTIAL_SLOT, f"opentrons_flex_96_tiprack_{pipette}ul"
    )
    return tip_rack_a1_nominal


async def aspirate_and_dispense(
    api: OT3API, reservoir: Point, volume: float
) -> Tuple[bool, float]:
    """Aspirate and wait."""
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, reservoir)
    await api.move_rel(OT3Mount.LEFT, Point(z=DEPTH_INTO_RESERVOIR_FOR_ASPIRATE))
    await asyncio.sleep(1)
    print("volume:",volume)
    await api.aspirate(OT3Mount.LEFT, volume)
    await asyncio.sleep(1)
    await api.dispense(OT3Mount.LEFT)
    await api.move_rel(OT3Mount.LEFT, Point(z=35))

async def bottom_top(api: OT3API,blow_out:float) -> None:
    # MOVE DOWN
    print(f"moving down {blow_out} mm ")
    await helpers_ot3.move_plunger_absolute_ot3(
        api, OT3Mount.LEFT, blow_out
    )
    await _record_plunger_alignment(api,OT3Mount.LEFT)
    # MOVE UP
    print(f"moving up {blow_out} mm ")
    await helpers_ot3.move_plunger_absolute_ot3(
        api, OT3Mount.LEFT, 0
    )
    await _record_plunger_alignment(api,OT3Mount.LEFT)

async def _drop_tip(api: OT3API, trash: Point) -> None:
    print("drop in trash")
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, trash + Point(z=20))
    await api.move_to(OT3Mount.LEFT, trash)
    await api.drop_tip(OT3Mount.LEFT)
    # NOTE: a FW bug (as of v14) will sometimes not fully drop tips.
    #       so here we ask if the operator needs to try again
    # while not api.is_simulator and ui.get_user_answer("try dropping again"):
    #     await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
    #     await api.drop_tip(OT3Mount.LEFT)
    await api.home_z(OT3Mount.LEFT)


async def _partial_pick_up_z_motion(
    api: OT3API, current: float, distance: float, speed: float
) -> None:
    async with api._backend.motor_current(run_currents={Axis.Z_L: current}):
        target_down = target_position_from_relative(
            OT3Mount.LEFT, Point(z=-distance), api._current_position
        )
        await api._move(target_down, speed=speed)
    target_up = target_position_from_relative(
        OT3Mount.LEFT, Point(z=distance), api._current_position
    )
    await api._move(target_up)
    await api._update_position_estimation([Axis.Z_L])


async def _partial_pick_up(
    api: OT3API, position: Point, current: float, pipette: Literal[200, 1000]
) -> None:
    await helpers_ot3.move_to_arched_ot3(
        api,
        OT3Mount.LEFT,
        position,
        safe_height=position.z + 10,
    )
    await _partial_pick_up_z_motion(api, current=current, distance=13, speed=5)
    await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(pipette))
    await api.prepare_for_aspirate(OT3Mount.LEFT)
    await api.home_z(OT3Mount.LEFT)

async def _record_plunger_alignment(
    api: OT3API,
    mount: types.OT3Mount,
    
) -> bool:
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    _current_pos = await api.current_position_ot3(mount)
    est = _current_pos[pipette_ax]
    if not api.is_simulator:
        _encoder_poses = await api.encoder_current_position_ot3(mount)
        enc = _encoder_poses[pipette_ax]
    else:
        enc = est
    _stalled_mm = est - enc
    print(f": motor={round(est, 2)}, encoder={round(enc, 2)}")
    _did_pass = abs(_stalled_mm) < STALL_THRESHOLD_MM
    # NOTE: only tests that are required to PASS need to show a results in the file
    data = [round(est, 2), round(enc, 2),_did_pass]
    # if _includes_result(current, speed):
    #     data.append(CSVResult.from_bool(_did_pass))  # type: ignore[arg-type]
    # report(
    #     _get_section_tag(cycle, current),
    #     _get_test_tag(cycle, current, speed, trial, direction, position),
    #     data,
    # )
    print(data)
    return _did_pass

async def _run(cycles: int, trials: int) -> None:
    """Run."""
    pipette = 200
    pipette_string = "p200_96_v3.0"
    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=False,
        pipette_left=pipette_string,
    )
    await api.home()
    _, _, blow_out, _ = helpers_ot3.get_plunger_positions_ot3(api, OT3Mount.LEFT)
    # GATHER NOMINAL POSITIONS
    trash_nominal = get_trash_nominal()
    tip_rack_96_a1_nominal = get_tiprack_96_nominal(pipette)
    # tip_rack_partial_a1_nominal = get_tiprack_partial_nominal()
    reservoir_a1_nominal = get_reservoir_nominal()
    #plate_a1_nominal = get_plate_nominal()
 
    reservoir_a1_actual: Optional[Point] = None
    #plate_a1_actual: Optional[Point] = None

    async def _find_reservoir_pos() -> None:
        nonlocal reservoir_a1_actual
        # if reservoir_a1_actual:  # re-find reservoir position for 5ul
        #     return
        # SAVE RESERVOIR POSITION
        ui.print_header("JOG to TOP of RESERVOIR")
        print("jog tips to the TOP of the RESERVOIR")
        await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, reservoir_a1_nominal + Point(z=10)
        )
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
        reservoir_a1_actual = await api.gantry_position(OT3Mount.LEFT)

    result = True
    
    get_test_volume = 200 #input("Input Test Volume(ul)?")
    #get_test_volume = float(get_test_volume.strip())

    tip_rack_pos = None
    tip_volume = 200
    #print(f"Ready to test x{number+1} {get_test_volume} uL")
        
    if not api.is_simulator:
            ui.get_user_ready(
                f"picking up tips, place tip-rack {tip_volume}ul on slot {TIP_RACK_96_SLOT}, RESERVOIR_SLOT on slot {RESERVOIR_SLOT}"
            )
    
    
    ui.print_header("JOG to 96-Tip RACK")
        
    if tip_rack_pos is None:
        await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, tip_rack_96_a1_nominal + Point(z=30)
        )
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
        tip_rack_pos = await api.gantry_position(OT3Mount.LEFT)
    else:
        await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, tip_rack_pos
        )
    await api.home([Axis.P_L])
    await api.pick_up_tip(
        OT3Mount.LEFT, helpers_ot3.get_default_tip_length(tip_volume)
    )
    await api.home_z(OT3Mount.LEFT)
    for number in range(cycles):
        
        # PICK-UP 96 TIPS
        
        
        if reservoir_a1_actual is None:
            await _find_reservoir_pos()
            await api.home_z(OT3Mount.LEFT)
        assert reservoir_a1_actual
        await aspirate_and_dispense(api, reservoir_a1_actual, get_test_volume)
        for n in range(trials):
            await bottom_top(api,blow_out)
            print('n',n)
            #input("continue")

        await api.home_z(OT3Mount.LEFT)
    await _drop_tip(api, tip_rack_pos)
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=DEFAULT_CYCLES)
    parser.add_argument("--n", type=int, default=DEFAULT_N)
    args = parser.parse_args()
    asyncio.run(_run(args.cycles,args.n))

