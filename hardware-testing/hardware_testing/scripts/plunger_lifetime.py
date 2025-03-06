#Plunger Lifetime
"""Pipette lifetime."""
#from time import time
from typing import List, Union, Tuple, Optional, Dict, Literal
import argparse
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.opentrons_api import types

from datetime import datetime
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point, Axis
import asyncio
import time
import datetime
import csv

DEFAULT_N = 1

async def aspirate_and_dispense(api: OT3API) -> str:
    top_position, bottom_position, blow_out, _ = helpers_ot3.get_plunger_positions_ot3(api, OT3Mount.LEFT)
    SZ_bottom_position = 67.5
    try:
        await helpers_ot3.move_plunger_absolute_ot3(
            api, OT3Mount.LEFT, top_position,
        )
        # await asyncio.sleep(1)
        await helpers_ot3.move_plunger_absolute_ot3(
            api, OT3Mount.LEFT, bottom_position,
        )
        # await api.prepare_for_aspirate(OT3Mount.LEFT)
        return "PASS"
    except Exception as err:
        print("aspirate_and_dispense",err)
        return "FAIL"
    
def _convert(seconds: float) -> str:
    weeks, seconds = divmod(seconds, 7 * 24 * 60 * 60)
    days, seconds = divmod(seconds, 24 * 60 * 60)
    hours, seconds = divmod(seconds, 60 * 60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)

async def _run(args) -> None:
    """Run."""
    pipette = 200
    pipette_string = "p200_96_v3.0"
    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=False,
        pipette_left=pipette_string,
    )
    await api.cache_instruments()

    await api.home()
    await api.home_z(OT3Mount.LEFT)
    # api.add_tip(OT3Mount.LEFT, 57.7)
    start_time = time.time()
    with open(f'/data/testing_data/{pipette_string}_plunger_lifetime.csv', 'w', newline='') as csvfile:
        test_data = {'Time(s)': None, 'Cycle': None, 'Error': None}
        writer = csv.DictWriter(csvfile, test_data)
        writer.writeheader()
        # 151256 + 885 = 152141
        # 1950,000
        cycle = args.start_cycle
        while True:
            try:
                asdipass = await aspirate_and_dispense(api)
                print(asdipass)
                elapsed_time = time.time() - start_time
                cycle += 1
                print(f"time: {elapsed_time}, Cycle Count: {cycle}")
                test_data['Cycle'] = cycle
                test_data['Time(s)'] = elapsed_time
                test_data['State'] = 'Pipetting'
                writer.writerow(test_data)
                print(test_data)
                csvfile.flush()
            except Exception as e:
                writer['Error'] = str(e)
                csvfile.flush()
                raise Exception(f"Error function: {e}")
    # 1.1*96 = 105.6
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=DEFAULT_N)
    parser.add_argument("--start_cycle", type=int, default=152141)
    args = parser.parse_args()
    asyncio.run(_run(args))