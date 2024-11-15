"""BMS PCR Protocol."""

from opentrons.protocol_api import ParameterContext, ProtocolContext, Labware
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
    TemperatureModuleContext,
)
from opentrons.protocol_api import SINGLE, Well
from abr_testing.protocols import helpers
from typing import List, Dict


metadata = {
    "protocolName": "PCR Protocol with TC Auto Sealing Lid",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.21"}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_single_pipette_mount_parameter(parameters)
    helpers.create_disposable_lid_parameter(parameters)
    helpers.create_csv_parameter(parameters)
    helpers.create_tc_lid_deck_riser_parameter(parameters)


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    pipette_mount = ctx.params.pipette_mount  # type: ignore[attr-defined]
    disposable_lid = ctx.params.disposable_lid  # type: ignore[attr-defined]
    parsed_csv = ctx.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    deck_riser = ctx.params.deck_riser  # type: ignore[attr-defined]

    rxn_vol = 50
    real_mode = True
    # DECK SETUP AND LABWARE

    tc_mod: ThermocyclerContext = ctx.load_module(
        helpers.tc_str
    )  # type: ignore[assignment]

    tc_mod.open_lid()
    tc_mod.set_lid_temperature(105)
    temp_mod: TemperatureModuleContext = ctx.load_module(
        helpers.temp_str, location="D3"
    )  # type: ignore[assignment]
    reagent_rack = temp_mod.load_labware(
        "opentrons_24_aluminumblock_nest_1.5ml_snapcap"
    )  # check if 2mL

    dest_plate = tc_mod.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt"
    )  # do I change this to tough plate if they run pcr?

    source_plate = ctx.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", location="D1"
    )  # do I change this to their plate?

    tiprack_50 = [
        ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in [8, 9]
    ]

    # Opentrons tough pcr auto sealing lids
    if disposable_lid:
        unused_lids = helpers.load_disposable_lids(ctx, 3, ["C3"], deck_riser)
    used_lids: List[Labware] = []

    # LOAD PIPETTES
    p50 = ctx.load_instrument(
        "flex_8channel_50",
        pipette_mount,
        tip_racks=tiprack_50,
        liquid_presence_detection=True,
    )
    p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
    ctx.load_trash_bin("A3")

    temp_mod.set_temperature(4)

    # LOAD LIQUIDS
    water: Well = reagent_rack["B1"]
    mmx_pic: List[Well] = reagent_rack.rows()[0]
    dna_pic: List[Well] = source_plate.wells()
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Water": [{"well": water, "volume": 1500.0}],
        "Mastermix": [{"well": mmx_pic, "volume": 1500.0}],
        "DNA": [{"well": dna_pic, "volume": 50.0}],
    }
    helpers.load_wells_with_custom_liquids(ctx, liquid_vols_and_wells)
    wells_to_probe = [[water], mmx_pic, dna_pic]
    wells_to_probe_flattened = [
        well for list_of_wells in wells_to_probe for well in list_of_wells
    ]
    helpers.find_liquid_height_of_all_wells(ctx, p50, wells_to_probe_flattened)
    # adding water
    ctx.comment("\n\n----------ADDING WATER----------\n")
    p50.pick_up_tip()
    # p50.aspirate(40, water) # prewet
    # p50.dispense(40, water)
    parsed_csv = parsed_csv[1:]
    num_of_rows = len(parsed_csv)
    for row_index in range(num_of_rows):
        row_values = parsed_csv[row_index]
        water_vol = row_values[1]
        if water_vol.lower() == "x":
            continue
        water_vol = int(water_vol)
        dest_well = row_values[0]
        if water_vol == 0:
            break

        p50.configure_for_volume(water_vol)
        p50.aspirate(water_vol, water)
        p50.dispense(water_vol, dest_plate[dest_well], rate=0.5)
        p50.configure_for_volume(50)
        # p50.blow_out()
    p50.drop_tip()

    # adding Mastermix
    ctx.comment("\n\n----------ADDING MASTERMIX----------\n")
    for i, row in enumerate(parsed_csv):
        p50.pick_up_tip()
        mmx_vol = row[3]
        if mmx_vol.lower() == "x":
            continue

        if i == 0:
            mmx_tube = row[4]
        mmx_tube_check = mmx_tube
        mmx_tube = row[4]
        if mmx_tube_check != mmx_tube:

            p50.drop_tip()
            p50.pick_up_tip()

        if not p50.has_tip:
            p50.pick_up_tip()

        mmx_vol = int(row[3])
        dest_well = row[0]

        if mmx_vol == 0:
            break
        p50.configure_for_volume(mmx_vol)
        p50.aspirate(mmx_vol, reagent_rack[mmx_tube])
        p50.dispense(mmx_vol, dest_plate[dest_well].top())
        ctx.delay(seconds=2)
        p50.blow_out()
        p50.touch_tip()
        p50.configure_for_volume(50)
        p50.drop_tip()
    if p50.has_tip:
        p50.drop_tip()

    # adding DNA
    ctx.comment("\n\n----------ADDING DNA----------\n")
    for row in parsed_csv:
        dna_vol = row[2]
        if dna_vol.lower() == "x":
            continue

        p50.pick_up_tip()

        dna_vol = int(row[2])
        dest_and_source_well = row[0]

        if dna_vol == 0:
            break
        p50.configure_for_volume(dna_vol)
        p50.aspirate(dna_vol, source_plate[dest_and_source_well])
        p50.dispense(dna_vol, dest_plate[dest_and_source_well], rate=0.5)

        p50.mix(
            10,
            0.7 * rxn_vol if 0.7 * rxn_vol < 30 else 30,
            dest_plate[dest_and_source_well],
        )
        p50.drop_tip()
        p50.configure_for_volume(50)
        wells_to_probe_flattened.append(dest_plate[dest_well])

    ctx.comment("\n\n-----------Running PCR------------\n")

    if real_mode:
        if disposable_lid:
            lid_on_plate, unused_lids, used_lids = helpers.use_disposable_lid_with_tc(
                ctx, unused_lids, used_lids, dest_plate, tc_mod
            )
        else:
            tc_mod.close_lid()
        helpers.perform_pcr(
            ctx,
            tc_mod,
            initial_denature_time_sec=120,
            denaturation_time_sec=10,
            anneal_time_sec=10,
            extension_time_sec=30,
            cycle_repetitions=30,
            final_extension_time_min=5,
        )

        tc_mod.set_block_temperature(4)

        tc_mod.open_lid()
        if disposable_lid:
            if len(used_lids) <= 1:
                ctx.move_labware(lid_on_plate, "C2", use_gripper=True)
            else:
                ctx.move_labware(lid_on_plate, used_lids[-2], use_gripper=True)
        p50.drop_tip()
        p50.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=tiprack_50)
        helpers.find_liquid_height_of_all_wells(ctx, p50, wells_to_probe_flattened)
