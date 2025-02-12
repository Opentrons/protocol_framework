"""Fast LLD R&D."""
import argparse
import asyncio
from dataclasses import dataclass
from typing import Optional, List, Any, Dict

from opentrons.config.defaults_ot3 import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Point
from hardware_testing.opentrons_api import helpers_ot3

from opentrons_shared_data.errors.exceptions import PositionUnknownError, StallOrCollisionDetectedError


MAX_PROBE_SECONDS = int(65 / 15)
NUM_TRIALS = 10
SPEEDS_TO_TEST = [25, 30, 35, 40, 45]


async def setup(api: OT3API) -> None:
    await api.cache_instruments()
    await api.set_gantry_load(api.gantry_load)
    print("homing...")
    await api.home()
    print("moving to center of deck")
    await api.move_rel(types.OT3Mount.LEFT, Point(x=-220, y=-200))
    for m in [types.OT3Mount.LEFT, types.OT3Mount.RIGHT]:
        api.add_tip(m, tip_length=80)


async def _test_speed(api: OT3API, m: types.OT3Mount, speed: float) -> int:
    _distance: float = max(110.0, MAX_PROBE_SECONDS * speed)
    _num_fails: int = 0
    for i in range(NUM_TRIALS):
        _result = "FAIL"
        try:
            await api.home([types.Axis.Z])
            await api.move_rel(m, Point(z=-30))
            await api.prepare_for_aspirate(m)
            await api.liquid_probe(m, _distance, z_top_speed=speed)
            _result = "PASS"
        except PositionUnknownError as e:
            print(e)
            _num_fails += 1
        except StallOrCollisionDetectedError as e:
            print(e)
            _num_fails += 1
        finally:
            print(f"{_result} at speed {speed} ({i + 1}/{NUM_TRIALS})")
    return _num_fails


async def run(api: OT3API):
    print("beginning test trials")
    _num_fails_per_speed: Dict[types.OT3Mount, Dict[float, int]] = {}
    for mnt in [types.OT3Mount.LEFT, types.OT3Mount.RIGHT]:
        _num_fails_per_speed[mnt] = {
            s: await _test_speed(api, mnt, s)
            for s in SPEEDS_TO_TEST
        }
    for s, info in _num_fails_per_speed.items():
        for mnt, num_fails in info.items():
            print(f"mount {str(mnt)} at speed {s} failed {num_fails}/{NUM_TRIALS} times")


async def _main(is_simulating: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p50_single_v3.5",
        pipette_right="p1000_single_v3.5",
    )
    await setup(api)
    await run(api)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args_parsed = parser.parse_args()
    asyncio.run(_main(args_parsed.simulate,))
