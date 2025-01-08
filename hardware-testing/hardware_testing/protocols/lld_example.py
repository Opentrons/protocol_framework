"""LLD Example."""
from opentrons.protocol_api import ProtocolContext, ParameterContext

from hardware_testing.opentrons_api import runtime_parameters as rtp


def add_parameters(params: ParameterContext) -> None:
    rtp.add_parameters_pipette(params)
    rtp.add_parameters_tiprack(params,
                               default_slot="B3")
    rtp.add_parameters_wellplate(params,
                                 name="src",
                                 default_slot="C3",
                                 default_name="opentrons_96_wellplate_200ul_pcr_full_skirt")
    rtp.add_parameters_wellplate(params,
                                 name="dst",
                                 default_slot="D3",
                                 default_name="corning_96_wellplate_360ul_flat")
    params.add_int("starting_volume", "starting_volume", 100, unit="uL")
    params.add_int("trials", "trials", 48, unit="x")
    params.add_float("aspirate_volume", "aspirate_volume", 1.0, unit="uL")
    params.add_float("aspirate_submerge", "aspirate_submerge", -1.5, unit="mm")


def run(ctx: ProtocolContext) -> None:
    p = ctx.params
    assert p.starting_volume > p.trials * p.aspirate_volume,\
        f"{p.starting_volume}, {p.trials}, {p.aspirate_volume}"
    pipette = ctx.load_instrument(
        p.pip_name, p.pip_mount,
        tip_racks=[ctx.load_labware(p.tips_name, p.tips_slot)]
    )
    src = ctx.load_labware(p.wellplate_name_src, p.wellplate_slot_src)
    dst = ctx.load_labware(p.wellplate_name_dst, p.wellplate_slot_dst)

    red_dye = ctx.define_liquid("red-dye")
    src["A1"].load_liquid(red_dye, p.starting_volume)

    for _ in range(p.trials):
        pipette.pick_up_tip()
        pipette.require_liquid_presence(src["A1"])
        asp_loc = src["A1"].meniscus(p.aspirate_submerge)
        pipette.aspirate(p.aspirate_volume, asp_loc)
    # TODO: how to get current height?
    # TODO: how to update volume of well
