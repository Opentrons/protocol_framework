"""Static Report Script."""
import sys
from typing import List
import argparse
import asyncio
from opentrons import protocol_api
from hardware_testing.gravimetric import helpers, workarounds
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.protocol_engine.types import LabwareOffset
from typing import List

import datetime
import requests
import time
from opentrons.types import Mount, Point
from opentrons.hardware_control.types import (
    OT3Mount,
    Axis
)

from hardware_testing.gravimetric.workarounds import (
    get_sync_hw_api,
)

requirements = {
    "robotType": "OT3",
    "apiLevel": "2.18",
}

LABWARE_OFFSETS: List[LabwareOffset] = []
ip = "10.14.21.32"

tiprack_columns = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11","A12"]

motor_current = 1.5
x_dimension_trash = 225
y_dimension_trash = 78
z_dimension_trash = 40

async def _main(args):
    
    if args.grab_calibration:
        timestamp = datetime.datetime.now()
        # Time adjustment for ABR robot timezone
        new_timestamp = timestamp - datetime.timedelta(hours=6)
        # automatically write what removal attempt was used
        if args.removal == 1:
            remove_type = "Removal Method 1"
        elif args.removal == 2:
            remove_type = "Removal Method 2"
        else:
            raise("Invalid removal type")
        if args.tip_location == 1:
            location = "Trash Bin"
        elif args.tip_location == 2:
            location = "Waste Chute"
        else:
            raise("Invalid tip location")
        # adding data grabbed from the robot's HTTP page
        # From health: api ver, firm ver, rob serial
        ip = "10.14.19.32"
        response = requests.get(
            f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
        )
        print(response)
        health_data = response.json()
        # from instruments we get pipette serial
        response = requests.get(
            f"http://{ip}:31950/pipettes", headers={"opentrons-version": "3"}
        )
        pipette_data = response.json()
        LABWARE_OFFSETS.extend(workarounds.http_get_all_labware_offsets())
    protocol = helpers.get_api_context(
        requirements["apiLevel"],  # type: ignore[attr-defined]
        is_simulating=args.simulate,
        pipette_right="p1000_multi_flex",
    )
    if args.grab_calibration:
        for offset in LABWARE_OFFSETS:
            engine = protocol._core._engine_client._transport._engine  # type: ignore[attr-defined]
            if offset.id not in engine.state_view._labware_store._state.labware_offsets_by_id:
                engine.state_view._labware_store._add_labware_offset(offset)
            else:
                print(f"Labware offset ID {offset.id} already exists.")
    hw_api = get_sync_hw_api(protocol)
    helpers_ot3.restart_server_ot3()
    hw_api.cache_instruments()
    attached_pipettes = hw_api.attached_pipettes
    pipette_name = attached_pipettes[Mount.RIGHT]['name']
    print(f'Pipettes: {attached_pipettes}')
    protocol.home()
    # Instrument setup
    pipette = protocol.load_instrument("flex_8channel_1000", 'right')
    pipette.home()
    # DECK SETUP AND LABWARE
    tiprack_1 = protocol.load_labware(tiprack, location="D1")
    # pcr_plate = protocol.load_labware(
    #     "opentrons_96_wellplate_200ul_pcr_full_skirt", location="B3"
    # )
    trash_bin = protocol.load_trash_bin("A3")
    # reservoir = protocol.load_labware("nest_12_reservoir_15ml", location="D3")
    hw_api.move_to(OT3Mount.RIGHT, Point(125,25,250))
    _move_coro = hw_api._move(
        target_position={Axis.P_R: attached_pipettes[Mount.RIGHT]['plunger_positions']['drop_tip']},  # type: ignore[arg-type]
        speed=10, expect_stalls=False)
    # await helpers_ot3.move_plunger_absolute_ot3(hw_api, OT3Mount.RIGHT, drop_position)
    input("Press Enter to continue...")
    _move_coro = hw_api._move(
        target_position={Axis.P_R: attached_pipettes[Mount.RIGHT]['plunger_positions']['bottom']},
        speed=10, expect_stalls=False)    
    
    start = time.time()
    #setup differences between waste chute and trash bin and tip types
    onek_adjust = 0
    if args.tip_type == 50 or args.tip_type == 200:
        adjustment = 49
    elif args.tip_type == 1000:
        adjustment = 87
    else:
        raise("Invalid tip type")
    
    tip_adjustment_height = -(95.5*(3/4))
    move_to_left_mm = args.knock_distance
    print(f'tip adjustment height: {tip_adjustment_height}')
    #add pause to measure static charge
    nozzle_nominal_diameter = 5.15
    x_edge = (x_dimension_trash/2)
    nozzle_radius = (nozzle_nominal_diameter/2)
    for column in tiprack_columns:
        pipette.pick_up_tip(tiprack_1[column])
        hw_api.move_rel(Mount.RIGHT, Point(0,0,120)) #make it go up out of tiprack to avoid collision
        
        pipette.move_to(location=trash_bin.top(z=tip_adjustment_height))
        input("Press Enter to continue")
        # consider using tip size var to make it scale
        _move_coro = hw_api._move(
            target_position={Axis.P_R: attached_pipettes[Mount.RIGHT]['plunger_positions']['drop_tip']},
            speed=10, expect_stalls=False)
        positions = hw_api.current_position_ot3(OT3Mount.RIGHT)
        print(f'Positions: {positions}')
        # x position = 362.63587499373926
        hw_api.move_to(Mount.RIGHT, Point(
                                        positions[Axis.X]-(x_edge+nozzle_radius),
                                        positions[Axis.Y],
                                        positions[Axis.by_mount(OT3Mount.RIGHT)]))
        input("Press Enter to continue...")
        hw_api.move_to(Mount.RIGHT, Point(
                                        positions[Axis.X]-(112.5+(5.5/2)),
                                        y_pos,
                                        z_pos)) #is -5
        
        
        hw_api._backend.motor_current(run_currents={Axis.P_R: motor_current})
        hw_api._move(
            target_position={Axis.P_R: attached_pipettes[Mount.RIGHT]['plunger_positions']['bottom']},  # type: ignore[arg-type]
            speed=10,
            expect_stalls=False,
        )
        hw_api.remove_tip(Mount.RIGHT)
        if args.removal == 2:
            hw_api.move_to(Mount.RIGHT, Point(x_pos - args.knock_distance,y_pos,(z_pos + adjustment - onek_adjust)))
        pipette.home()
    protocol.home()
    pipette.home()

    # from datetime we get our runtime
    tot_run_time = int(time.time() - start)
    print(tot_run_time)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--tip_type", default=1000, choices=[50,200,1000], type=int)
    parser.add_argument("--removal", default=1, choices=['Trash Bin', 'Waste Chute'], type=int)
    parser.add_argument("--ip_address", default="10.14.19.32", type=str)
    #1 = trash bin, 2 = waste chute
    parser.add_argument("--tip_location", default=1, type=int)
    parser.add_argument("--knock_distance", default=10, type=float)
    parser.add_argument("--grab_calibration", action="store_true")
    args = parser.parse_args()
    if args.tip_type == 50:
        tiprack = "opentrons_flex_96_tiprack_50ul"
    elif args.tip_type == 200:
        tiprack = "opentrons_flex_96_tiprack_200ul"
    elif args.tip_type == 1000:
        tiprack = "opentrons_flex_96_tiprack_1000ul"
    else:
        raise("Invalid tip type")
    
    asyncio.run(_main(args))