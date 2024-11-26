"""Robot leveling QC OT3."""
from os import environ

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"

import argparse
import asyncio
from pathlib import Path

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from .laser_stj_10_m0 import LaserSensor


async def _main() -> None:
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())

    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        use_defaults=True,  # use default belt calibration
        is_simulating=False,
        pipette_left="p1000_single_v3.5",
        pipette_right="p1000_single_v3.5",
        gripper="GRPV122",
    )

    await api.home()


if __name__ == "__main__":
    asyncio.run(_main())
