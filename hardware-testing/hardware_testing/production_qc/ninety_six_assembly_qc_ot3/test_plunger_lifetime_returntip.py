"""Pipette lifetime."""
from asyncio import sleep

#from time import time
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
    CSVSection,
    CSVLineRepeating,
)
from hardware_testing import data

import os,json

from datetime import datetime
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
DEFAULT_N = 1

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

def get_reservoir_nominal() -> Point:
    """Get nominal reservoir position."""
    reservoir_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        RESERVOIR_SLOT, RESERVOIR_LABWARE
    )
    # center the 96ch of the 1-well labware
    reservoir_a1_nominal += OFFSET_FOR_1_WELL_LABWARE
    return reservoir_a1_nominal

def get_tiprack_96_nominal(pipette: Literal[200, 1000]) -> Point:
    """Get nominal tiprack position for 96-tip pick-up."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_96_SLOT, f"opentrons_flex_96_tiprack_{pipette}ul"
    )
    return tip_rack_a1_nominal + Point(z=TIP_RACK_96_ADAPTER_HEIGHT)

async def aspirate_and_dispense(
    api: OT3API, reservoir: Point, volume: float, cycle: int
) -> Tuple[bool, float]:

    try:
        """Aspirate and wait."""
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, reservoir + Point(z = DEPTH_INTO_RESERVOIR_FOR_ASPIRATE))
        # await api.move_rel(OT3Mount.LEFT, Point(z=DEPTH_INTO_RESERVOIR_FOR_ASPIRATE))
        # input("Press Enter to continue")
        await asyncio.sleep(1)
        print("volume:",volume)
        await helpers_ot3.move_plunger_absolute_ot3(
            api, OT3Mount.LEFT, 0.5
        )
        await asyncio.sleep(1)
        await helpers_ot3.move_plunger_absolute_ot3(
            api, OT3Mount.LEFT, 67.5
        )
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

async def _drop_tip(api: OT3API, trash: Point) -> None:
    print("drop in trash")
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, trash + Point(z=10))
    await api.move_to(OT3Mount.LEFT, trash)
    await api.drop_tip(OT3Mount.LEFT)
    # NOTE: a FW bug (as of v14) will sometimes not fully drop tips.
    #       so here we ask if the operator needs to try again
    # while not api.is_simulator and ui.get_user_answer("try dropping again"):
    #     await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
    #     await api.drop_tip(OT3Mount.LEFT)
    await api.home_z(OT3Mount.LEFT)

async def _record_plunger_alignment(
    api: OT3API,
    mount: types.OT3Mount,
    nnnnn:int,
    cycles:int,
    Direction:str,
    Position:str

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
    data = [cycles, nnnnn,Direction,Position, round(est, 2), round(enc, 2),_did_pass]

    print(data)
    return data

# async def savedata(datalist:list):
#     header_str = data.convert_list_to_csv_line(datalist)
#     data.append_data_to_file(
#         test_name=test_name, file_name=file_name, data=header_str
#     )

async def _run(cycles: int, trials: int) -> None:
    """Run."""
    pathjson = f"/data/testing_data/lifetimep200h.json"
    pipette = 200
    pipette_string = "p200_96_v3.0"
    # BUILD API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=False,
        pipette_left=pipette_string,
    )

    #report = _build_csv_report(cycles=cycles, trials=trials)
    global start_time
    global elapsed_time
    import time
    start_time = time.perf_counter()
    elapsed_time = 0.0

    #report
    test_pipdicc = api.get_attached_instrument(OT3Mount.LEFT)
    test_pip = test_pipdicc["pipette_id"]
    global test_name
    test_name = "plunger-bottom-top-lifetime-test"
    global file_name
    cycles_star = 1
    global run_id
    run_id = data.create_run_id()
    tip_rack_pos = None
    tip_rack_96_a1_nominal = get_tiprack_96_nominal(pipette)
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

    await _drop_tip(api, tip_rack_pos)

    assert True
    input("1")

    if args.restart_flag:
        if os.path.exists(pathjson):
            with open(pathjson, "r") as openfile:
                calibrated_slot_loc = json.load(openfile)
                file_name= calibrated_slot_loc["csv_name"]
                cycles_star = calibrated_slot_loc["cycles_star"]

    else:
        file_name = data.create_file_name(
            test_name=test_name,
            run_id=run_id,
            tag="",
            pipid=test_pip,
        )
        test_robot = input("Enter robot ID:\n\t>> ")
        test_operator = input("Enter test operator:\n\t>> ")

        data1 = ["test_name","96_plunger_lifetime"]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )


        data1 = ["test_device_id",f"{test_pip}"]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name,  file_name=file_name, data=header_str
        )


        data1 = ["test_run_id",run_id]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )

        data1 = ["test_robot_id",f"{test_robot}"]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )

        data1 = ["test_time_utc",datetime.utcnow().strftime("%y-%m-%d-%H-%M-%S")]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )

        data1 = ["test_operator",test_operator]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )

        data1 = ["test_version",]
        header_str = data.convert_list_to_csv_line(data1)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )




        header = [
            "Time (W:H:M:S)",
            "CYCLES",
            "N",
            "Direction",
            "Position",
            "Current_pos",
            "Encoder_poses"

        ]
        header_str = data.convert_list_to_csv_line(header)
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )

        with open("/data/testing_data/lifetimep200h.json", 'w') as outfile:
            json_object = {}
            json_object["cycles_star"]=cycles_star
            json_object["csv_name"]= f'{file_name}'
            calibrated_slot_loc = json.dumps(json_object, indent=0)
            outfile.write(calibrated_slot_loc)

    await api.home()
    _, _, blow_out, _ = helpers_ot3.get_plunger_positions_ot3(api, OT3Mount.LEFT)
    # GATHER NOMINAL POSITIONS
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

        print(f'reservoir point: {reservoir_a1_nominal}')
        print(f'reservoir point: {reservoir_a1_nominal + Point(z=10)}')
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
            f"\n\t picking up tips, place tip-rack {tip_volume}ul on slot {TIP_RACK_96_SLOT}, RESERVOIR_SLOT on slot {RESERVOIR_SLOT}"
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


    #await _drop_tip(api, tip_rack_pos)


    await api.pick_up_tip(
        OT3Mount.LEFT, helpers_ot3.get_default_tip_length(tip_volume)
    )
    await api.home_z(OT3Mount.LEFT)
    for number in range(cycles_star,cycles):

        # PICK-UP 96 TIPS
        if reservoir_a1_actual is None:
            await _find_reservoir_pos()
            await api.home_z(OT3Mount.LEFT)
        assert reservoir_a1_actual
        asdipass = await aspirate_and_dispense(api, reservoir_a1_actual, get_test_volume, number)

        if number % 100 == 0:
            try:
                await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, reservoir_a1_actual)
                await helpers_ot3.move_plunger_absolute_ot3(
                    api, OT3Mount.LEFT, 72.5
                )
                await helpers_ot3.move_plunger_absolute_ot3(
                    api, OT3Mount.LEFT, 67.5
                )
                m_plunge_flag = "PASS"
            except:
                m_plunge_flag = "FAIL"
            header_str = data.convert_list_to_csv_line(["number%100_move_plunger_absolute",m_plunge_flag])
            data.append_data_to_file(
                test_name=test_name, file_name=file_name, data=header_str
            )

        header_str = data.convert_list_to_csv_line(["aspirate_and_dispense",asdipass])
        data.append_data_to_file(
            test_name=test_name, file_name=file_name, data=header_str
        )
        # if number % 2 == 0:
        #     await api.move_rel(OT3Mount.LEFT, Point(z=35))
        for n in range(trials):
            #bottom
            passval = await _record_plunger_alignment(api,OT3Mount.LEFT,n,number,"bottom","start")
            time2 = _convert(time.perf_counter() - elapsed_time - start_time)
            wlist = []
            wlist.append(time2)
            wlist = wlist + passval
            header_str = data.convert_list_to_csv_line(wlist)
            data.append_data_to_file(
                test_name=test_name, file_name=file_name, data=header_str
            )


            # print(f"moving down {blow_out} mm ")
            # await helpers_ot3.move_plunger_absolute_ot3(
            #     api, OT3Mount.LEFT, blow_out
            # )
            time2 = _convert(time.perf_counter() - elapsed_time - start_time)
            passval = await _record_plunger_alignment(api,OT3Mount.LEFT,n,number,"bottom","end")
            wlist = []
            wlist.append(time2)
            wlist = wlist + passval
            header_str = data.convert_list_to_csv_line(wlist)
            data.append_data_to_file(
                test_name=test_name, file_name=file_name, data=header_str
            )

            #top
            print(f"moving top {blow_out} mm ")
            time2 = _convert(time.perf_counter() - elapsed_time - start_time)
            passval = await _record_plunger_alignment(api,OT3Mount.LEFT,n,number,"top","start")
            wlist = []
            wlist.append(time2)
            wlist = wlist + passval
            header_str = data.convert_list_to_csv_line(wlist)
            data.append_data_to_file(
                test_name=test_name,  file_name=file_name, data=header_str
            )

            # await helpers_ot3.move_plunger_absolute_ot3(
            #     api, OT3Mount.LEFT, 0
            # )
            time2 = _convert(time.perf_counter() - elapsed_time - start_time)
            passval = await _record_plunger_alignment(api,OT3Mount.LEFT,n,number,"top","end")
            wlist = []
            wlist.append(time2)
            wlist = wlist + passval
            header_str = data.convert_list_to_csv_line(wlist)
            data.append_data_to_file(
                test_name=test_name, file_name=file_name, data=header_str
            )

            #bottom
            passval = await _record_plunger_alignment(api,OT3Mount.LEFT,n,number,"bottom","start")
            time2 = _convert(time.perf_counter() - elapsed_time - start_time)
            wlist = []
            wlist.append(time2)
            wlist = wlist + passval
            header_str = data.convert_list_to_csv_line(wlist)
            data.append_data_to_file(
                test_name=test_name, file_name=file_name, data=header_str
            )


            # print(f"moving down {blow_out} mm ")
            # await helpers_ot3.move_plunger_absolute_ot3(
            #     api, OT3Mount.LEFT, blow_out
            # )
            time2 = _convert(time.perf_counter() - elapsed_time - start_time)
            passval = await _record_plunger_alignment(api,OT3Mount.LEFT,n,number,"bottom","end")
            wlist = []
            wlist.append(time2)
            wlist = wlist + passval
            header_str = data.convert_list_to_csv_line(wlist)
            data.append_data_to_file(
                test_name=test_name, file_name=file_name, data=header_str
            )

            #print('n',n)
            #input("continue")
        if os.path.exists(pathjson):
            with open(
                pathjson, "r"
            ) as openfile:
                print("Recording...\n")
                calibrated_slot_loc = json.load(openfile)
                complete_dict = {
                    "cycles_star": number + 1,
                    "csv_name": file_name
                }
                calibrated_slot_loc.update(complete_dict)
                with open(
                    pathjson,
                    "w",
                ) as writefile:
                    json.dump(calibrated_slot_loc, writefile)
        # await api.home([Axis.X,Axis.Y,Axis.Z_L])
        #await api.prepare_for_aspirate(OT3Mount.LEFT)
    await _drop_tip(api, tip_rack_pos)
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycles", type=int, default=DEFAULT_CYCLES)
    parser.add_argument("--n", type=int, default=DEFAULT_N)
    #parser.add_argument("--load_cal", action="store_true")
    parser.add_argument("--restart_flag", action="store_true")
    args = parser.parse_args()
    asyncio.run(_run(args.cycles,args.n))
