"""Omega Bio-tek Mag-Bind Blood & Tissue DNA HDQ - Bacteria."""
from typing import List, Dict
from abr_testing.protocols import helpers
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Well,
    InstrumentContext,
)
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
    TemperatureModuleContext,
)
from opentrons import types
import numpy as np

metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "protocolName": "Omega Bio-tek Mag-Bind Blood & Tissue DNA HDQ - Bacteria",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.21",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_dot_bottom_parameter(parameters)


# Start protocol
def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    dot_bottom = ctx.params.dot_bottom  # type: ignore[attr-defined]

    USE_GRIPPER = True
    dry_run = False
    tip_mixing = False

    wash_vol = 600.0
    AL_vol = 230.0
    bind_vol = 320.0
    sample_vol = 180.0
    elution_vol = 100.0

    # Same for all HDQ Extractions
    deepwell_type = "nest_96_wellplate_2ml_deep"
    if not dry_run:
        settling_time = 2.0
        num_washes = 3
    if dry_run:
        settling_time = 0.5
        num_washes = 1
    bead_vol = PK_vol = 20.0
    inc_temp = 55.0
    AL_total_vol = AL_vol + PK_vol
    binding_buffer_vol = bead_vol + bind_vol
    starting_vol = AL_total_vol + sample_vol

    h_s: HeaterShakerContext = ctx.load_module(helpers.hs_str, "D1")  # type: ignore[assignment]
    sample_plate, h_s_adapter = helpers.load_hs_adapter_and_labware(
        deepwell_type, h_s, "Sample Plate"
    )
    h_s.close_labware_latch()
    samples_m = sample_plate.wells()[0]

    # NOTE: MAG BLOCK will be on slot 6

    temp: TemperatureModuleContext = ctx.load_module(
        helpers.temp_str, "A3"
    )  # type: ignore[assignment]
    elutionplate, tempblock = helpers.load_temp_adapter_and_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", temp, "Elution Plate/Reservoir"
    )

    magblock: MagneticBlockContext = ctx.load_module(
        "magneticBlockV1", "C1"
    )  # type: ignore[assignment]
    liquid_waste = ctx.load_labware("nest_1_reservoir_195ml", "B3", "Liquid Waste")
    waste = liquid_waste.wells()[0].top()

    lysis_reservoir = ctx.load_labware(deepwell_type, "D2", "Lysis reservoir")
    lysis_res = lysis_reservoir.wells()[0]
    bind_reservoir = ctx.load_labware(
        deepwell_type, "C2", "Beads and binding reservoir"
    )
    bind_res = bind_reservoir.wells()[0]
    wash1_reservoir = ctx.load_labware(deepwell_type, "C3", "Wash 1 reservoir")
    wash1_res = wash1_reservoir.wells()[0]
    wash2_reservoir = ctx.load_labware(deepwell_type, "B1", "Wash 2 reservoir")
    wash2_res = wash2_reservoir.wells()[0]
    elution_res = elutionplate.wells()[0]
    # Load Pipette and tip racks
    # Load tips
    tiprack_1 = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        "A1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tips = tiprack_1.wells()[0]

    tiprack_2 = ctx.load_labware(
        "opentrons_flex_96_tiprack_1000ul",
        "A2",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tips1 = tiprack_2.wells()[0]
    # load 96 channel pipette
    pip: InstrumentContext = ctx.load_instrument(
        "flex_96channel_1000", mount="left", tip_racks=[tiprack_1, tiprack_2]
    )
    # Load Liquids and probe
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Lysis Buffer": [{"well": lysis_reservoir.wells(), "volume": AL_vol + 92.0}],
        "PK Buffer": [{"well": lysis_reservoir.wells(), "volume": PK_vol + 8.0}],
        "Binding Buffer": [{"well": bind_reservoir.wells(), "volume": bind_vol + 91.5}],
        "Magnetic Beads": [{"well": bind_reservoir.wells(), "volume": bead_vol + 8.5}],
        "Wash 1 and 2 Buffer": [
            {"well": wash1_reservoir.wells(), "volume": (wash_vol * 2.0) + 100.0}
        ],
        "Wash 3 Buffer": [
            {"well": wash2_reservoir.wells(), "volume": wash_vol + 100.0}
        ],
        "Elution Buffer": [{"well": elutionplate.wells(), "volume": elution_vol + 5}],
        "Samples": [{"well": sample_plate.wells(), "volume": sample_vol}],
    }

    helpers.find_liquid_height_of_loaded_liquids(ctx, liquid_vols_and_wells, pip)

    pip.flow_rate.aspirate = 50
    pip.flow_rate.dispense = 150
    pip.flow_rate.blow_out = 300

    def resuspend_pellet(vol: float, plate: Well, reps: int = 3) -> None:
        """Re-suspend pellets."""
        pip.flow_rate.aspirate = 200
        pip.flow_rate.dispense = 300

        loc1 = plate.bottom().move(types.Point(x=1, y=0, z=1))
        loc2 = plate.bottom().move(types.Point(x=0.75, y=0.75, z=1))
        loc3 = plate.bottom().move(types.Point(x=0, y=1, z=1))
        loc4 = plate.bottom().move(types.Point(x=-0.75, y=0.75, z=1))
        loc5 = plate.bottom().move(types.Point(x=-1, y=0, z=1))
        loc6 = plate.bottom().move(types.Point(x=-0.75, y=0 - 0.75, z=1))
        loc7 = plate.bottom().move(types.Point(x=0, y=-1, z=1))
        loc8 = plate.bottom().move(types.Point(x=0.75, y=-0.75, z=1))

        if vol > 1000:
            vol = 1000

        mixvol = vol * 0.9

        for _ in range(reps):
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc1)
            pip.aspirate(mixvol, loc2)
            pip.dispense(mixvol, loc2)
            pip.aspirate(mixvol, loc3)
            pip.dispense(mixvol, loc3)
            pip.aspirate(mixvol, loc4)
            pip.dispense(mixvol, loc4)
            pip.aspirate(mixvol, loc5)
            pip.dispense(mixvol, loc5)
            pip.aspirate(mixvol, loc6)
            pip.dispense(mixvol, loc6)
            pip.aspirate(mixvol, loc7)
            pip.dispense(mixvol, loc7)
            pip.aspirate(mixvol, loc8)
            pip.dispense(mixvol, loc8)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol, loc8)
                pip.dispense(mixvol, loc8)

        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

    def bead_mix(vol: float, plate: Well, reps: int = 5) -> None:
        """Bead mix."""
        pip.flow_rate.aspirate = 200
        pip.flow_rate.dispense = 300

        loc1 = plate.bottom().move(types.Point(x=0, y=0, z=1))
        loc2 = plate.bottom().move(types.Point(x=0, y=0, z=8))
        loc3 = plate.bottom().move(types.Point(x=0, y=0, z=16))
        loc4 = plate.bottom().move(types.Point(x=0, y=0, z=24))

        if vol > 1000:
            vol = 1000

        mixvol = vol * 0.9

        for _ in range(reps):
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc1)
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc2)
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc3)
            pip.aspirate(mixvol, loc1)
            pip.dispense(mixvol, loc4)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 50
                pip.flow_rate.dispense = 30
                pip.aspirate(mixvol, loc1)
                pip.dispense(mixvol, loc1)

        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 200

    # Start Protocol
    temp.set_temperature(inc_temp)
    # Transfer and mix lysis
    pip.pick_up_tip(tips)
    pip.aspirate(AL_total_vol, lysis_res)
    pip.dispense(AL_total_vol, samples_m)
    resuspend_pellet(400, samples_m, reps=4 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()

    # Mix, then heat
    h_s.set_and_wait_for_shake_speed(1800)
    ctx.delay(
        minutes=10 if not dry_run else 0.25,
        msg="Please wait 10 minutes to allow for proper lysis mixing.",
    )
    if not dry_run:
        h_s.set_and_wait_for_temperature(55)
    ctx.delay(
        minutes=10 if not dry_run else 0.25,
        msg="Please allow another 10 minutes of 55C incubation to complete lysis.",
    )
    h_s.deactivate_shaker()

    # Transfer and mix bind&beads
    pip.pick_up_tip(tips)
    bead_mix(binding_buffer_vol, bind_res, reps=4 if not dry_run else 1)
    pip.aspirate(binding_buffer_vol, bind_res)
    pip.dispense(binding_buffer_vol, samples_m)
    bead_mix(binding_buffer_vol + starting_vol, samples_m, reps=4 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()
        pip.home()

    # Shake for binding incubation
    h_s.set_and_wait_for_shake_speed(rpm=1800)
    ctx.delay(
        minutes=10 if not dry_run else 0.25,
        msg="Please allow 10 minutes for the beads to bind the DNA.",
    )
    h_s.deactivate_shaker()

    h_s.open_labware_latch()
    # Transfer plate to magnet
    ctx.move_labware(
        sample_plate,
        magblock,
        use_gripper=USE_GRIPPER,
    )
    h_s.close_labware_latch()

    ctx.delay(
        minutes=settling_time,
        msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.",
    )

    # Remove Supernatant and move off magnet
    pip.pick_up_tip(tips)
    pip.aspirate(1000, samples_m.bottom(dot_bottom))
    pip.dispense(1000, waste)
    if starting_vol + binding_buffer_vol > 1000:
        pip.aspirate(1000, samples_m.bottom(dot_bottom))
        pip.dispense(1000, waste)
    pip.return_tip()

    # Transfer plate from magnet to H/S
    helpers.move_labware_to_hs(ctx, sample_plate, h_s, h_s_adapter)

    # Washes
    for i in range(num_washes if not dry_run else 1):
        if i == 0 or i == 1:
            wash_res = wash1_res
        else:
            wash_res = wash2_res

        pip.pick_up_tip(tips)
        pip.aspirate(wash_vol, wash_res)
        pip.dispense(wash_vol, samples_m)
        if not tip_mixing:
            pip.return_tip()

        h_s.set_and_wait_for_shake_speed(rpm=1800)
        ctx.delay(minutes=5 if not dry_run else 0.25)
        h_s.deactivate_shaker()

        # Transfer plate to magnet
        helpers.move_labware_from_hs_to_destination(ctx, sample_plate, h_s, magblock)

        ctx.delay(
            minutes=settling_time,
            msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.",
        )

        # Remove Supernatant and move off magnet
        pip.pick_up_tip(tips)
        pip.aspirate(1000, samples_m.bottom(dot_bottom))
        pip.dispense(1000, bind_res.top())
        if wash_vol > 1000:
            pip.aspirate(1000, samples_m.bottom(dot_bottom))
            pip.dispense(1000, bind_res.top())
        pip.return_tip()

        # Transfer plate from magnet to H/S
        helpers.move_labware_to_hs(ctx, sample_plate, h_s, h_s_adapter)

    # Dry beads
    if dry_run:
        drybeads = 0.5
    else:
        drybeads = 10
    # Number of minutes you want to dry for
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(
            minutes=0.5,
            msg="There are " + str(beaddry) + " minutes left in the drying step.",
        )

    # Elution
    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, elution_res)
    pip.dispense(elution_vol, samples_m)
    resuspend_pellet(elution_vol, samples_m, reps=3 if not dry_run else 1)
    if not tip_mixing:
        pip.return_tip()
        pip.home()

    h_s.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(
        minutes=5 if not dry_run else 0.25,
        msg="Please wait 5 minutes to allow dna to elute from beads.",
    )
    h_s.deactivate_shaker()

    # Transfer plate to magnet
    helpers.move_labware_from_hs_to_destination(ctx, sample_plate, h_s, magblock)

    ctx.delay(
        minutes=settling_time,
        msg="Please wait " + str(settling_time) + " minute(s) for beads to pellet.",
    )

    pip.pick_up_tip(tips1)
    pip.aspirate(elution_vol, samples_m)
    pip.dispense(elution_vol, elutionplate.wells()[0])
    pip.return_tip()

    pip.home()
    pip.reset_tipracks()
    helpers.find_liquid_height_of_all_wells(ctx, pip, [liquid_waste["A1"]])
