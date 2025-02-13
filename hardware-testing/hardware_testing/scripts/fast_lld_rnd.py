"""Fast LLD R&D."""
import argparse
import asyncio
from typing import Dict, List

from opentrons.hardware_control.ot3api import OT3API
from opentrons.config.defaults_ot3 import DEFAULT_LIQUID_PROBE_SETTINGS

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Point
from hardware_testing.opentrons_api import helpers_ot3

from opentrons_shared_data.errors.exceptions import (
    PositionUnknownError,
    StallOrCollisionDetectedError,
)


async def setup(api: OT3API, skip_home: bool, mounts: List[types.OT3Mount]) -> None:
    await api.cache_instruments()
    await api.set_gantry_load(api.gantry_load)
    if not skip_home:
        print("homing...")
        await api.home()
        print("moving to center of deck")
        await api.move_rel(types.OT3Mount.LEFT, Point(x=-220, y=-200))
    for m in mounts:
        api.add_tip(m, tip_length=80)


async def _test_speed(api: OT3API, m: types.OT3Mount, speed: float, trials: int) -> int:
    top, bottom, _, _ = helpers_ot3.get_plunger_positions_ot3(api, m)
    plunger_lld_speed = DEFAULT_LIQUID_PROBE_SETTINGS.plunger_speed
    max_probe_pass_seconds = ((bottom - top) / plunger_lld_speed) * 0.8
    _distance: float = min(110.0, max_probe_pass_seconds * speed)
    _num_fails: int = 0

    for i in range(trials):
        _error = None
        await api.home([types.Axis.Z])
        await api.move_rel(m, Point(z=-30))
        await api.prepare_for_aspirate(m)
        try:
            await api.liquid_probe(m, _distance, z_top_speed=speed)
        except PositionUnknownError as e:
            _error = e
        except StallOrCollisionDetectedError as e:
            _error = e
        finally:
            if _error:
                print(_error)
                _num_fails += 1
                _result = "FAIL"
            else:
                _result = "PASS"
            print(f"{_result} at speed {speed} ({i + 1}/{trials})")
    return _num_fails


async def run(api: OT3API, mounts: List[types.OT3Mount], trials: int, speeds: List[float]):
    _num_fails_per_speed: Dict[types.OT3Mount, Dict[float, int]] = {}
    for mnt in mounts:
        _num_fails_per_speed[mnt] = {}
        for s in speeds:
            print(f"testing {mnt.name} at speed {s} for {trials} trials")
            _num_fails_per_speed[mnt][s] = await _test_speed(api, mnt, s, trials)
            if _num_fails_per_speed[mnt][s] == trials:
                print("skipping remaining speeds after failing all trials")
                break
    for s, info in _num_fails_per_speed.items():
        for mnt, num_fails in info.items():
            print(
                f"mount {str(mnt)} at speed {s} failed {num_fails}/{trials} times"
            )


async def check_mounts(api: OT3API, mounts: List[types.OT3Mount]) -> List[types.OT3Mount]:
    _checked_mounts = []
    for m in mounts:
        try:
            for _ in range(3):
                await api.home([types.Axis.by_mount(m)])
                await api.move_rel(m, Point(z=-120))
                await api.move_rel(m, Point(z=120))
            _checked_mounts.append(m)
        except Exception as e:
            print(e)
            continue
    return _checked_mounts


async def _main(is_simulating: bool, skip_home: bool, trials: int, speeds: List[float], mounts: List[types.OT3Mount]) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p50_single_v3.5",
        pipette_right="p1000_single_v3.5",
    )
    await setup(api, skip_home, mounts)
    checked_mounts = await check_mounts(api, mounts)
    await run(api, checked_mounts, trials, speeds)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--skip-home", action="store_true")
    parser.add_argument("--trials", type=int, default=3)
    parser.add_argument("--speeds", nargs="+", default=[5, 10, 20])
    parser.add_argument("--mounts", nargs="+", default=["left", "right"])
    args = parser.parse_args()
    asyncio.run(_main(
        bool(args.simulate),
        bool(args.skip_home),
        int(args.trials),
        [float(s) for s in args.speeds],
        [types.OT3Mount.LEFT if m == "left" else types.OT3Mount.RIGHT for m in args.mounts],
    ))
