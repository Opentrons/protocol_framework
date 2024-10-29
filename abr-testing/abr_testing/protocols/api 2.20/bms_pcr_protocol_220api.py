"""BMS PCR Protocol."""

from opentrons.protocol_api import ParameterContext, ProtocolContext, Labware
from opentrons.protocol_api.module_contexts import ThermocyclerContext, TemperatureModuleContext
from opentrons.protocol_api import SINGLE
from abr_testing.protocols import helpers
import threading
from opentrons.hardware_control.modules.types import ThermocyclerStep
from typing import List


metadata = {
    'protocolName': 'PCR Protocol with TC Auto Sealing Lid',
    'author': 'Rami Farawi <ndiehl@opentrons.com',
}
requirements = {
    'robotType': 'OT-3',
    'apiLevel': '2.20'
}

    
def add_parameters(parameters: ParameterContext):
    helpers.create_pipette_mount_parameter(parameters)
    helpers.create_disposable_lid_parameter(parameters)
    parameters.add_csv_file(
        display_name = "Samples",
        variable_name = "samples_csv",
        description = "Asp/ disp volumes."
    )

def run(ctx: ProtocolContext)-> None:
    """Protocol."""
    pipette_mount = ctx.params.pipette_mount
    disposable_lid = ctx.params.disposable_lid
    csv_samp = ctx.params.samples_csv

    real_mode = True
    # DECK SETUP AND LABWARE

    tc_mod: ThermocyclerContext = ctx.load_module('thermocyclerModuleV2')

    tc_mod.open_lid()
    tc_mod.set_lid_temperature(105)
    temp_mod: TemperatureModuleContext = ctx.load_module('temperature module gen2', location='D3')
    reagent_rack = temp_mod.load_labware(
        'opentrons_24_aluminumblock_nest_1.5ml_snapcap')  # check if 2mL

    dest_plate = tc_mod.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')  # do I change this to tough plate if they run pcr?

    source_plate = ctx.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', location="D1") # do I change this to their plate?

    tiprack_50 = [ctx.load_labware('opentrons_flex_96_tiprack_50ul',  slot) for slot in [8, 9]]
    
    # Opentrons tough pcr auto sealing lids
    if disposable_lid:
        unused_lids = [ctx.load_labware("opentrons_tough_pcr_auto_sealing_lid", "C3")]
        for i in range(2):
            unused_lids.append(unused_lids[-1].load_labware("opentrons_tough_pcr_auto_sealing_lid"))
        unused_lids.reverse() 
    used_lids = []

    # LOAD PIPETTES
    p50 = ctx.load_instrument(
        "flex_8channel_50", pipette_mount, tip_racks=tiprack_50, liquid_presence_detection = True)
    p50.configure_nozzle_layout(
        style=SINGLE,
        start="A1",
        tip_racks=tiprack_50)
    ctx.load_trash_bin("A3")
    ctx.define_liquid(name="Mastermix", description='Mastermix', display_color='#008000')
    ctx.define_liquid(name="Water", description='Water', display_color='#A52A2A')
    ctx.define_liquid(name="DNA", description='DNA', display_color='#A52A2A')

    # mapping
    csv_lines = [[val.strip() for val in line.split(',')]
                 for line in csv_samp.splitlines()
                 if line.split(',')[0].strip()][1:]

    
    temp_mod.set_temperature(4)


    water = reagent_rack['B1']
    water.load_liquid(liquid=water_liq, volume=1500)
    #
    mmx_pic = reagent_rack.rows()[0]
    for mmx_well in mmx_pic:
        mmx_well.load_liquid(liquid=mmx_liq, volume=1500)
    
    dna_pic = source_plate.wells()
    for dna_well in dna_pic:
        dna_well.load_liquid(liquid=dna_liq, volume=50)

    # adding water
    ctx.comment('\n\n----------ADDING WATER----------\n')
    p50.pick_up_tip()
    # p50.aspirate(40, water) # prewet
    # p50.dispense(40, water)
    for row in csv_lines:
        water_vol = row[1]
        if water_vol.lower() == 'x':
            continue
        water_vol = int(row[1])
        dest_well = row[0]
        if water_vol == 0:
            break

        p50.configure_for_volume(water_vol)
        p50.aspirate(water_vol, water)
        p50.dispense(water_vol, dest_plate[dest_well], rate=0.5)
        p50.configure_for_volume(50)

        # p50.blow_out()
    p50.drop_tip() 

    # adding Mastermix
    ctx.comment('\n\n----------ADDING MASTERMIX----------\n')
    for i, row in enumerate(csv_lines):
        p50.pick_up_tip()
        mmx_vol = row[3]
        if mmx_vol.lower() == 'x':
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
    ctx.comment('\n\n----------ADDING DNA----------\n')
    for row in csv_lines:

        dna_vol = row[2]
        if dna_vol.lower() == 'x':
            continue

        p50.pick_up_tip()

        dna_vol = int(row[2])
        dest_and_source_well = row[0]


        if dna_vol == 0:
            break
        p50.configure_for_volume(dna_vol)
        p50.aspirate(dna_vol, source_plate[dest_and_source_well])
        p50.dispense(dna_vol, dest_plate[dest_and_source_well], rate=0.5)

        p50.mix(10, 0.7*rxn_vol if 0.7*rxn_vol < 30 else 30, dest_plate[dest_and_source_well])
        p50.drop_tip() 
        p50.configure_for_volume(50)

    ctx.comment('\n\n-----------Running PCR------------\n')

    if real_mode:

        profile1: List[ThermocyclerStep] = [
                    {'temperature': 95, 'hold_time_minutes': 2},
        ]
        profile2: List[ThermocyclerStep] = [

                    {'temperature': 98, 'hold_time_seconds': 10},
                    {'temperature': 58, 'hold_time_seconds': 10},
                    {'temperature': 72, 'hold_time_seconds': 30}
        ]
        profile3: List[ThermocyclerStep] = [
                    {'temperature': 72, 'hold_time_minutes': 5}
        ]
        if disposable_lid:
            lid_on_plate, unused_lids, used_lids = helpers.use_disposable_lid_with_tc(ctx, unused_lids, used_lids, dest_plate, tc_mod)
        else:
            tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=50)
        tc_mod.execute_profile(steps=profile2, repetitions=30, block_max_volume=50)
        tc_mod.execute_profile(steps=profile3, repetitions=1, block_max_volume=50)
        tc_mod.set_block_temperature(4)

    tc_mod.open_lid()
    if disposable_lid:
        if  len(used_lids) <= 1:
            ctx.move_labware(lid_on_plate, "C2", use_gripper = True)
        else:
            ctx.move_labware(lid_on_plate, used_lids[-2], use_gripper = True)
