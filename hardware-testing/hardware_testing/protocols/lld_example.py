"""LLD Example."""
from typing import List

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Parameters,
    Well,
)

from hardware_testing.opentrons_api import runtime_parameters as rtp


metadata = {"protocolName": "Flex: LLD Example"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

MINIMUM_PLATE_READER_UL = 200
DESTINATION_PLATE_NAME = "corning_96_wellplate_360ul_flat"


def add_parameters(params: ParameterContext) -> None:
    rtp.add_parameters_pipette(params, "pipette")
    rtp.add_parameters_tiprack(params, "tiprack", default_slot="B3")
    rtp.add_parameters_tiprack(
        params,
        label="diluent_tiprack",
        default_slot="B3",
        default_name="opentrons_flex_96_tiprack_200ul",
    )
    rtp.add_parameters_reservoir(
        params,
        label="diluent_src",
        default_slot="A3",
        default_name="nest_12_reservoir_15ml",
    )
    rtp.add_parameters_wellplate(
        params,
        label="red_dye_src",
        default_slot="C3",
        default_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
    )
    rtp.add_parameter_slot(
        params,
        label="destination_slot",
        default_slot="D3",
    )
    params.add_int("trials", "trials", default=48, minimum=1, maximum=96, unit="qty")
    params.add_float(
        "aspirate_volume",
        "aspirate_volume",
        default=1.0,
        minimum=0.0,
        maximum=1000.0,
        unit="uL",
    )
    params.add_float(
        "submerge", "submerge", default=-1.5, minimum=-10.0, maximum=0.0, unit="mm"
    )
    params.add_int(
        "diluent_dead_vol",
        "diluent_dead_vol",
        default=3,
        minimum=0,
        maximum=15000,
        unit="mL",
    )
    params.add_int(
        "destination_start_row",
        "destination_start_row",
        default=1,
        minimum=1,
        maximum=12,
    )
    params.add_str(
        "dye_well",
        "dye_well",
        default="A1",
        choices=[{"display_name": n, "value": n} for n in ["A1", "A2"]],
    )
    params.add_str(
        "diluent_well",
        "diluent_well",
        default="A1",
        choices=[{"display_name": n, "value": n} for n in ["A1", "A2"]],
    )


def spread_diluent(
    ctx: ProtocolContext, p: Parameters, destination_wells: List[Well]
) -> None:
    diluent_ul_per_well = MINIMUM_PLATE_READER_UL - p.aspirate_volume
    assert diluent_ul_per_well > 0, f"{diluent_ul_per_well}"
    blue_diluent = ctx.define_liquid("blue-diluent", display_color="#0000FF")
    multi = ctx.load_instrument(
        instrument_name="flex_8channel_1000",
        mount={"left": "right", "right": "left"}[p.pipette_mount],
        tip_racks=[ctx.load_labware(p.diluent_tiprack_name, p.diluent_tiprack_slot)],
    )
    source_plate = ctx.load_labware(
        load_name=p.diluent_src_name, location=p.diluent_src_slot
    )
    diluent_ul_required = (diluent_ul_per_well * p.trials) + p.diluent_dead_vol
    source_plate.load_liquid([p.diluent_well], diluent_ul_required, blue_diluent)
    multi.pick_up_tip()
    multi.require_liquid_presence(source_plate[p.diluent_well])
    for trial in range(0, p.trials, multi.channels):
        multi.aspirate(
            diluent_ul_per_well, source_plate[p.diluent_well].meniscus(p.submerge)
        )
        multi.dispense(
            multi.current_volume, destination_wells[trial].meniscus(p.submerge)
        )
    multi.drop_tip()


def spread_red_dye(
    ctx: ProtocolContext, p: Parameters, destination_wells: List[Well]
) -> None:
    red_dye = ctx.define_liquid("red-dye", display_color="#FF0000")
    source_plate = ctx.load_labware(
        load_name=p.red_dye_src_name, location=p.red_dye_src_slot
    )
    source_plate.load_liquid([p.src_well], source_plate[p.dye_well].max_volume, red_dye)

    pipette = ctx.load_instrument(
        instrument_name=p.pipette_name,
        mount=p.pipette_mount,
        tip_racks=[ctx.load_labware(p.tiprack_name, p.tiprack_slot)],
    )
    for trial in range(p.trials):
        pipette.pick_up_tip()
        pipette.require_liquid_presence(source_plate[p.dye_well])
        asp_loc = source_plate[p.dye_well].meniscus(p.aspirate_submerge)
        pipette.aspirate(p.aspirate_volume, asp_loc)
        disp_loc = destination_wells[trial].meniscus(p.submerge)
        pipette.dispense(pipette.current_volume, disp_loc)


def run(ctx: ProtocolContext) -> None:
    destination_plate = ctx.load_labware(
        load_name=DESTINATION_PLATE_NAME, location=ctx.params.destination_slot
    )
    destination_plate.load_empty(destination_plate.wells())
    start_well_idx = (ctx.params.destination_start_row - 1) * 8
    destination_wells = destination_plate.wells()[start_well_idx:]
    if ctx.params.aspirate_volume < MINIMUM_PLATE_READER_UL:
        spread_diluent(ctx, ctx.params, destination_wells)
    spread_red_dye(ctx, ctx.params, destination_wells)
