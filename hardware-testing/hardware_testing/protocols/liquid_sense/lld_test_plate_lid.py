"""Test plate lid definition."""
from opentrons.protocol_api import ProtocolContext, ParameterContext
from os import listdir
from opentrons_shared_data.load import get_shared_data_root

metadata = {"protocolName": "Test Plate Lid"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": ["A2", "A3", "B2", "B3", "A4", "B4"],
    "src": "C2",
    "src_tube": "B1",
    "dst": ["D3", "D2", "D1", "C1"],
    "tips_200": "A1",
    "diluent_reservoir": "C3",
    "lids": "D4"
}

SRC_LABWARE = "opentrons_96_wellplate_200ul_pcr_full_skirt"
DST_LABWARE = "corning_96_wellplate_360ul_flat"
DILUENT_LABWARE = "nest_12_reservoir_15ml"

def get_latest_version(load_name: str) -> int:
    labware_def_location = (
        f"{get_shared_data_root()}/labware/definitions/3/{load_name}/"
    )
    labware_def_latest = sorted(listdir(labware_def_location))[-1]
    return int(labware_def_latest[0])

def add_parameters(parameters: ParameterContext):
    parameters.add_int(
        variable_name="num_of_plates",
        display_name="Number of Plates",
        minimum=1,
        maximum=4,
        default=4,
    )

def run(ctx: ProtocolContext)-> None:
    """Run."""
    num_of_plates = ctx.params.num_of_plates
    lids = [ctx.load_labware("plate_lid", SLOTS["lids"])]
    for i in range(num_of_plates):
        lids.append(lids[-1].load_labware("plate_lid"))
    lids.reverse()
    dst_labwares = []
    for i in range(num_of_plates+1):
        if i == 0:
            continue
        dst_labware_XX = ctx.load_labware(
            DST_LABWARE,
            location=SLOTS["dst"][i - 1],
            version=get_latest_version(DST_LABWARE),
            label=f"DST Labware {i}",
        )
        dst_labwares.append(dst_labware_XX)
    n = 0
    new_stack = []
    for dst_labware in dst_labwares:
        ctx.move_labware(lids[n], dst_labware, use_gripper = True)
        if n == 0:
            ctx.move_labware(lids[n], "C2", use_gripper = True)
            new_stack.append(lids[n])
            print("move lid c2")
        else:
            ctx.move_labware(lids[n], new_stack[-1], use_gripper = True)
            print("move lid to stack")
            new_stack.append(lids[n])
        n+=1
    n = 0