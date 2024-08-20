"""Static Report Script."""
import sys
from typing import List
import argparse
import asyncio
from opentrons import protocol_api
from hardware_testing.drivers import asair_sensor
from hardware_testing.gravimetric import helpers, workarounds
from hardware_testing.opentrons_api import helpers_ot3
from opentrons.protocol_engine.types import LabwareOffset
import datetime
import requests
import time
from opentrons.types import Mount
from opentrons.types import Point


from hardware_testing.gravimetric.workarounds import (
    get_sync_hw_api,
)

requirements = {
    "robotType": "OT3",
    "apiLevel": "2.18",
}

LABWARE_OFFSETS: List[LabwareOffset] = []
ip = "10.14.19.236"
print("1")
# try:
#     sys.path.insert(0, "/var/lib/jupyter/notebooks")
#     import google_sheets_tool  # type: ignore[import]

#     credentials_path = "/var/lib/jupyter/notebooks/credentials.json"
#     print("2")
# except ImportError:
#     pass


async def _main(simulate: bool, tiprack: str, removal: int, tip_location: int, tip_type: int, pipette_size: int, nozzles, nozzle2):
    print("3")
    if not simulate:
        print("4")
        """ Commenting out all the google drive data collection
        sensor = asair_sensor.BuildAsairSensor(False, False)
        print("5")
        print(sensor)
        header = [
            "Intention of Run",
            "Removal Location",
            "Finish Time",
            "Tip Size",
            "Removed?",
            "Total Run Time",
            "Temperature (C)",
            "Humidity (%)",
            "Software",
            "Firmware",
            "Pipette Serial",
            "Robot Serial",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "Total",
        ]
        # Upload to google has passed
        try:
            google_sheet = google_sheets_tool.google_sheet(
                credentials_path, "Static Testing Report", tab_number=0
            )
            print("Connected to the google sheet.")
        except FileNotFoundError:
            print(
                "There are no google sheets credentials. Make sure credentials in jupyter notebook."
            )

        print("6")
        # main()

        # The part where we get and input sensor data.
        env_data = sensor.get_reading()
        temp = env_data.temperature
        rh = env_data.relative_humidity
        # grab timestamp
        timestamp = datetime.datetime.now()
        # Time adjustment for ABR robot timezone
        new_timestamp = timestamp - datetime.timedelta(hours=6)
        # Adjusting time as robots are on UTC
        print("11")
        # automatically write what removal attempt was used
        remove_type = "Control"
        if removal == 1:
            remove_type = "Removal Method 1"
        if removal == 2:
            remove_type = "Removal Method 2"
        print("12")
        if tip_location == 1:
            location = "Trash Bin"
        if tip_location == 2:
            location = "Waste Chute"
        # adding data grabbed from the robot's HTTP page
        # From health: api ver, firm ver, rob serial
        response = requests.get(
            f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
        )
        print(response)
        print("13")
        health_data = response.json()
        firm = health_data.get("fw_version", "")
        soft = health_data.get("api_version", "")
        rob_serial = health_data.get("robot_serial", "")
        print("14")
        # from instruments we get pipette serial
        response = requests.get(
            f"http://{ip}:31950/pipettes", headers={"opentrons-version": "3"}
        )
        pipette_data = response.json()
        pipette_serial = pipette_data['left'].get("id", "")
        print("15")

    #store most data in case of unsuccessful run
        row = [
            remove_type,
            location,
            str(new_timestamp),
            args.tip_type,
            "",  # will only write if it is not removed, IE will be blank unless the run fails. LATER
            "", #not occured yet
            temp,
            rh,
            soft,
            firm,
            pipette_serial,
            rob_serial,
        ]
        # write to google sheet
        try:
            if google_sheet.credentials.access_token_expired:
                google_sheet.gc.login()
            google_sheet.write_header(header)
            google_sheet.update_row_index()
            google_sheet.write_to_row(row)
            print("Wrote row")
        except RuntimeError:
            print("Did not write row.")
        # hopefully this writes to the google sheet
        print("hope so")
        """

    LABWARE_OFFSETS.extend(workarounds.http_get_all_labware_offsets())
    print(f"simulate {simulate}")
    protocol = helpers.get_api_context(
        "2.18",  # type: ignore[attr-defined]
        is_simulating=simulate,
        pipette_left= nozzle2,
    )
   
    for offset in LABWARE_OFFSETS:
        engine = protocol._core._engine_client._transport._engine  # type: ignore[attr-defined]
        if offset.id not in engine.state_view._labware_store._state.labware_offsets_by_id:
            engine.state_view._labware_store._add_labware_offset(offset)
        else:
            print(f"Labware offset ID {offset.id} already exists.")

    hw_api = get_sync_hw_api(protocol)
    helpers_ot3.restart_server_ot3()
    for i in range(25):
        hw_api.cache_instruments(require={Mount.LEFT: nozzle2})
        attached = hw_api.attached_pipettes
        try:
            print(attached[Mount.LEFT])
            print(attached[Mount.LEFT]['name'])

            break
        except:
            print("failed to find")
            await asyncio.sleep(2)
    run(protocol, tiprack, removal, tip_location, tip_type, pipette_size, nozzles, nozzle2)

def run(protocol: protocol_api.ProtocolContext, tiprack: str, removal: int, tip_location: int, tip_type: int, pipette_size: int, nozzles, nozzle2) -> None:

    print("7")

    # Instrument setup
    pleft = protocol.load_instrument(nozzles, "left")
    print("8")
    # DECK SETUP AND LABWARE
    tiprack_1 = protocol.load_labware(tiprack, location="D1")
    pcr_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", location="B3"
    )
    trash_bin = protocol.load_trash_bin("A3")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", location="D3")
    # tip rack columns
    tiprack_columns = [
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "A6",
        "A7",
        "A8",
        "A9",
        "A10",
        "A11",
        "A12",
    ]
    print("9")
    protocol.home()
    print("9.5")
    pleft.home()
    print("9.75")
    hw_api = get_sync_hw_api(protocol)
    print("10")
    #move gantry to the front and extend ejector for easier static application
    hw_api.move_to(Mount.LEFT, Point(125,25,250))
    print("11.5")
    hw_api.drop_tip(mount=Mount.LEFT, removal=1)
    coords = hw_api.current_position_ot3(Mount.LEFT)
    print(coords)
    input("Press Enter to definitely continue...")     
    if pipette_size != 96:    
        protocol.home()   
        pleft.home()
    start = time.time()
    #setup differences between waste chute and trash bin and tip types
    if pipette_size == 8:
        #the onek_adjustment variable allows the pipette to go both down and to the side when knocking off 1000uL tips on the waste chute
        onek_adjust = 0
        """the adjustment variable is the height of the tip, allowing the z axis to stay in the same spot when it 
        goes from thinking it has a tip attached to thinking it does not."""
        if tip_type == 50 or tip_type == 200:
            adjustment = 49
        if tip_type == 1000:
            adjustment = 87
        #these positions are determined by where the tip is being knocked off
        x_pos = 400
        y_pos = 395
        z_pos = -5
        knock_distance = 10
        if tip_location == 1:
            knock_distance = 10
            x_pos = 330
            if tip_type == 1000:
                z_pos = -43
        elif tip_location == 2:
            knock_distance = 30
            y_pos = 25
            x_pos = 327
            if tip_type == 50 or tip_type == 200:
                z_pos = 81
            if tip_type == 1000:
                z_pos = 58
                onek_adjust = 25
        elif tip_location == 3:
            x_pos = 14.4
            y_pos = 74.4
            z_pos = 54
            knock_distance = -10
        else:
            sys.exit("Please choose valid location")

    if pipette_size == 96:
        onek_adjust = 0
        adjustment = 0
        y_pos = 26
        x_pos = 334
        knock_distance = 250
        if tip_location == 1:
            sys.exit("Cannot use 96ch and trash bin.")
        elif tip_location == 2:
            if tip_type == 50 or tip_type == 200:
                z_pos = 135
            if tip_type == 1000:
                z_pos = 150


    #add pause to measure static charge
    for column in tiprack_columns:
        if pipette_size != 96:    
            pleft.pick_up_tip(tiprack_1[column])
            coords = hw_api.current_position_ot3(Mount.LEFT)
            print(coords)
            hw_api.move_rel(Mount.LEFT, Point(0,0,120)) #make it go up out of tiprack to avoid collision
        if tip_location == 3:
            hw_api.move_to(Mount.LEFT, Point(125,25,130))
        hw_api.move_to(Mount.LEFT, Point(x_pos,y_pos,250-adjustment))
        hw_api.move_to(Mount.LEFT, Point(x_pos,y_pos,z_pos))
        if pipette_size != 96:    
            hw_api.drop_tip(mount=Mount.LEFT, removal=removal)
        if removal == 1:
            hw_api.move_to(Mount.LEFT, Point(x_pos - knock_distance,y_pos,(z_pos + adjustment - onek_adjust)))
        if tip_location == 3:
            raise Exception("Sorry, only one column for now")
        pleft.home()
    protocol.home()
    pleft.home()

    # from datetime we get our runtime
    tot_run_time = int(time.time() - start)
    print(tot_run_time)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--tip_type", type=int)
    parser.add_argument("--removal", type=int)
    parser.add_argument("--pipette_size", type=int)
    #1 = trash bin, 2 = waste chute
    parser.add_argument("--tip_location", type=int)
    args = parser.parse_args()
    if args.tip_type == 50:
        tiprack = "opentrons_flex_96_tiprack_50ul"

    if args.tip_type == 200:
        tiprack = "opentrons_flex_96_tiprack_200ul"

    if args.tip_type == 1000:
        tiprack = "opentrons_flex_96_tiprack_1000ul"
    
    if args.pipette_size == 1:
        nozzles = "flex_1channel_1000"
        nozzle2 = "p1000_single_flex"

    if args.pipette_size == 8:
        nozzles = "flex_8channel_1000"
        nozzle2 = "p1000_multi_flex"

    if args.pipette_size == 96:
        nozzles = "flex_96channel_1000"
        nozzle2 = "p1000_96"

    asyncio.run(_main(args.simulate, tiprack, args.removal, args.tip_location, args.tip_type, args.pipette_size, nozzles, nozzle2))