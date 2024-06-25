"""Static Report Script."""
import sys
from typing import List
import argparse
import asyncio
from opentrons import protocol_api
from hardware_testing.drivers import asair_sensor
from hardware_testing.gravimetric import helpers, workarounds
from opentrons.protocol_engine.types import LabwareOffset
import datetime
import requests
import time


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
try:
    sys.path.insert(0, "/var/lib/jupyter/notebooks")
    import google_sheets_tool  # type: ignore[import]

    credentials_path = "/var/lib/jupyter/notebooks/credentials.json"
    print("2")
except ImportError:
    raise ImportError(
        "Run on robot. Make sure google_sheets_tool.py is in jupyter notebook."
    )


async def _main(simulate: bool, tiprack: str, removal: int):
    start = time.time()
    print("3")

    print("4")
    # try to figure out how to input everything but final temp, run time, and if removed.
    # test_name = "ABR-Static-Report"
    sensor = asair_sensor.BuildAsairSensor(False, False)
    print("5")
    print(sensor)
    header = [
        "Intention of Run",
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
        "Static Occured?",
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
    # adding data grabbed from the robot's HTTP page
    # From health: api ver, firm ver, rob serial
    response = requests.get(
        f"http://{ip}:31950/health", headers={"opentrons-version": "3"}
    )
    print(response)
    print("13")
    health_data = response.json()
    firm = health_data.get("fw_version", "")
    soft = health_data.get("system_version", "")
    rob_serial = health_data.get("robot_serial", "")
    print("14")
    # from instruments we get pipette serial
    response = requests.get(
        f"http://{ip}:31950/pipettes", headers={"opentrons-version": "3"}
    )
    pipette_data = response.json()
    pipette_serial = pipette_data["left"].get("id", "")
    print("15")
    # from datetime we get our runtime
    tot_run_time = int(time.time() - start)

    row = [
        remove_type,
        str(new_timestamp),
        args.tip_type,
        "",  # will only write if it is not removed, IE will be blank unless the run fails. LATER
        tot_run_time,
        temp,
        rh,
        soft,
        firm,
        pipette_serial,
        rob_serial,
        "",  # static occur? need to input manually
    ]
    print("16")
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
    print("17")

    LABWARE_OFFSETS.extend(workarounds.http_get_all_labware_offsets())
    protocol = helpers.get_api_context(
        "2.18",  # type: ignore[attr-defined]
        is_simulating=simulate,
    )
    for offset in LABWARE_OFFSETS:
        engine = protocol._core._engine_client._transport._engine  # type: ignore[attr-defined]
        engine.state_view._labware_store._add_labware_offset(offset)
    run(protocol, tiprack, removal)

    await asyncio.sleep(1)


def run(protocol: protocol_api.ProtocolContext, tiprack: str, removal: int) -> None:

    print("7")
    print("8")
    # Instrument setup
    pleft = protocol.load_instrument("flex_8channel_1000", "left")
    # DECK SETUP AND LABWARE
    protocol.load_trash_bin("A3")
    tiprack_1 = protocol.load_labware(tiprack, location="D1")
    pcr_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", location="B3"
    )
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
    hw_api = get_sync_hw_api(protocol)
    print("10")
    for i in list(range(2)):
        for column in tiprack_columns:
            pleft.pick_up_tip(tiprack_1[column])
            pleft.aspirate(50, reservoir[column])
            pleft.dispense(50, pcr_plate[column])
            # consider using tip size var to make it scale
            hw_api.drop_tip(tiprack_1[column], removal=removal)
        pleft.reset_tipracks()


# TODO:
# connect to google sheet
# get initial temp/humidity
# pick up tips
# aspirate from 12 well
# dispense into PCR
# eject tips into trash
# attempt removal solution
# repeat for next column

# get final temp/humidity
# report software/firmware, pipette serial, robot serial, Pipette type, tip size, total run time from time library


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--tip_type", type=int)
    parser.add_argument("--removal", type=int)
    args = parser.parse_args()
    if args.tip_type == 50:
        tiprack = "opentrons_flex_96_tiprack_50ul"

    if args.tip_type == 200:
        tiprack = "opentrons_flex_96_tiprack_200ul"

    if args.tip_type == 1000:
        tiprack = "opentrons_flex_96_tiprack_1000ul"

    asyncio.run(_main(args.simulate, tiprack, args.removal))