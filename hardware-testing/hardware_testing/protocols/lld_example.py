"""LLD Example."""
from opentrons.protocol_api import ProtocolContext, ParameterContext

from hardware_testing.opentrons_api import runtime_parameters as rtp


def add_parameters(params: ParameterContext) -> None:
    rtp.add_parameters_pipette(params, "pipette")
    rtp.add_parameters_tiprack(params, "tiprack", default_slot="B3")
    rtp.add_parameters_tiprack(
        params,
        label="diluent_tiprack",
        default_slot="B3",
        default_name="opentrons_flex_96_tiprack_200uL",
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
    rtp.add_parameters_wellplate(
        params,
        label="optical_dst",
        default_slot="D3",
        default_name="corning_96_wellplate_360ul_flat",
    )
    params.add_int("starting_volume", "starting_volume", default=100, unit="uL")
    params.add_int("trials", "trials", default=48, unit="qty")
    params.add_float("aspirate_volume", "aspirate_volume", default=1.0, unit="uL")
    params.add_float("submerge", "submerge", default=-1.5, unit="mm")
    params.add_str("dye_well", "dye_well", default="A1")
    params.add_str("diluent_well", "diluent_well", default="A1")


def run(ctx: ProtocolContext) -> None:
    p = ctx.params
    assert (
        p.starting_volume > p.trials * p.aspirate_volume
    ), f"Bad Runtime Variables ({p.starting_volume},{p.trials},{p.aspirate_volume})"

    red_dye = ctx.define_liquid("red-dye", display_color="#FF0000")
    blue_diluent = ctx.define_liquid("blue-diluent", display_color="#0000FF")

    red_dye_src = ctx.load_labware(p.red_dye_src_name, p.red_dye_src_slot)
    diluent_src = ctx.load_labware(p.diluent_src_name, p.diluent_src_slot)
    dst = ctx.load_labware(p.optical_dst_name, p.optical_dst_slot)
    red_dye_src.load_empty()
    diluent_src.load_empty()
    dst.load_empty()

    red_dye_src.load_liquid([p.src_well], p.starting_volume, red_dye)
    diluent_ul_per_well = max(200 - p.aspirate_volume, 0)
    if diluent_ul_per_well:
        diluent_ul_required = diluent_ul_per_well * p.trials
        diluent_ul_per_reservoir_src = (diluent_ul_required / 2) + 3000
        diluent_src.load_liquid(
            [p.diluent_well], diluent_ul_per_reservoir_src, blue_diluent
        )

    pipette = ctx.load_instrument(
        p.pipette_name,
        p.pipette_mount,
        tip_racks=[ctx.load_labware(p.tiprack_name, p.tiprack_slot)],
    )
    multi = ctx.load_instrument(
        "flex_8channel_1000",
        {"left": "right", "right": "left"}[p.pip_mount],
        tip_racks=[ctx.load_labware(p.diluent_tiprack_name, p.diluent_tiprack_slot)],
    )

    # spread the diluent
    multi.pick_up_tip()
    multi.require_liquid_presence(diluent_src[p.diluent_well])
    for trial in range(0, p.trials, multi.channels):
        multi.aspirate(
            diluent_ul_per_well, diluent_src[p.diluent_well].meniscus(p.submerge)
        )
        multi.dispense(multi.current_volume, dst.wells()[trial].meniscus(p.submerge))
    multi.drop_tip()

    # spread the dye
    for trial in range(p.trials):
        # pick-up tip, then probe source well to find new meniscus position
        pipette.pick_up_tip()
        pipette.require_liquid_presence(red_dye_src[p.dye_well])
        # aspirate the "submerge" depth below the meniscus
        asp_loc = red_dye_src[p.dye_well].meniscus(p.aspirate_submerge)
        pipette.aspirate(p.aspirate_volume, asp_loc)
        # contact-dispense (
        disp_loc = dst.wells()[trial].meniscus(p.submerge)
        pipette.dispense(pipette.current_volume, disp_loc)
