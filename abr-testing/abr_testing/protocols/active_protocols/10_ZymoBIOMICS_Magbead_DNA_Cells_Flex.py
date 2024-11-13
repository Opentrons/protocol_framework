"""Flex ZymoBIOMICS Magbead DNA Extraction: Cells."""
import math
from opentrons import types
from typing import List, Dict
from opentrons import protocol_api
from opentrons.protocol_api import Well, InstrumentContext
import numpy as np
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    TemperatureModuleContext,
    MagneticBlockContext,
)
from abr_testing.protocols import helpers

metadata = {
    "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>",
    "protocolName": "Flex ZymoBIOMICS Magbead DNA Extraction: Cells",
}

requirements = {"robotType": "OT-3", "apiLevel": "2.21"}
"""
Slot A1: Tips 1000
Slot A2: Tips 1000
Slot A3: Temperature module (gen2) with 96 well PCR block and Armadillo 96 well PCR Plate
Slot B1: Tips 1000
Slot B3: Nest 1 Well Reservoir
Slot C1: Magblock
Slot C2: Nest 12 well 15 ml Reservoir
Slot D1: H-S with Nest 96 Well Deepwell and DW Adapter
Slot D2: Nest 12 well 15 ml Reservoir
Slot D3: Trash

Reservoir 1:
Well 1 - 12,320 ul
Wells 2-4 - 11,875 ul
Wells 5-6 - 13,500 ul
Wells 7-8 - 13,500 ul
Well 12 - 5,200 ul

Reservoir 2:
Wells 1-12 - 9,000 ul

"""
whichwash = 1
sample_max = 48
tip1k = 0
tip200 = 0
drop_count = 0


def add_parameters(parameters: protocol_api.ParameterContext) -> None:
    """Define parameters."""
    helpers.create_hs_speed_parameter(parameters)
    helpers.create_single_pipette_mount_parameter(parameters)
    helpers.create_dot_bottom_parameter(parameters)


def run(ctx: protocol_api.ProtocolContext) -> None:
    """Protocol Set Up."""
    heater_shaker_speed = ctx.params.heater_shaker_speed  # type: ignore[attr-defined]
    mount = ctx.params.pipette_mount  # type: ignore[attr-defined]
    dot_bottom = ctx.params.dot_bottom  # type: ignore[attr-defined]
    dry_run = False
    TIP_TRASH = (
        False  # True = Used tips go in Trash, False = Used tips go back into rack
    )
    res_type = "nest_12_reservoir_15ml"

    num_samples = 8
    wash1_vol = 500.0
    wash2_vol = wash3_vol = 900.0
    lysis_vol = 200.0
    sample_vol = 10.0  # Sample should be pelleted tissue/bacteria/cells
    bind_vol = 600.0
    bind2_vol = 500.0
    elution_vol = 75.0

    # Protocol Parameters
    deepwell_type = "nest_96_wellplate_2ml_deep"

    if not dry_run:
        settling_time = 2.0
        lysis_incubation = 30.0
        bind_time_1 = 10.0
        bind_time_2 = 1.0
        wash_time = 5.0
        drybeads = 9.0
        lysis_rep_1 = 3
        lysis_rep_2 = 5
        bead_reps_2 = 8
    else:
        settling_time = 0.25
        lysis_incubation = 0.25
        bind_time_1 = bind_time_2 = wash_time = 0.25
        drybeads = 0.5
        lysis_rep_1 = lysis_rep_2 = bead_reps_2 = 1
    PK_vol = 20.0
    bead_vol = 25.0
    starting_vol = lysis_vol + sample_vol
    binding_buffer_vol = bind_vol + bead_vol
    ctx.load_trash_bin("A3")
    h_s: HeaterShakerContext = ctx.load_module(helpers.hs_str, "D1")  # type: ignore[assignment]
    labware_name = "Samples"
    sample_plate, h_s_adapter = helpers.load_hs_adapter_and_labware(
        deepwell_type, h_s, labware_name
    )
    h_s.close_labware_latch()

    temp: TemperatureModuleContext = ctx.load_module(
        helpers.temp_str, "D3"
    )  # type: ignore[assignment]
    elutionplate, temp_adapter = helpers.load_temp_adapter_and_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", temp, "Elution Plate"
    )
    magblock: MagneticBlockContext = ctx.load_module(
        helpers.mag_str, "C1"
    )  # type: ignore[assignment]
    waste_reservoir = ctx.load_labware("nest_1_reservoir_195ml", "B3", "Liquid Waste")
    waste = waste_reservoir.wells()[0].top()
    res1 = ctx.load_labware(res_type, "D2", "reagent reservoir 1")
    res2 = ctx.load_labware(res_type, "C2", "reagent reservoir 2")
    num_cols = math.ceil(num_samples / 8)

    # Load tips and combine all similar boxes
    tips1000 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "Tips 1")
    tips1001 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "Tips 2")
    tips1002 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B1", "Tips 3")
    tips = [*tips1000.wells()[num_samples:96], *tips1001.wells(), *tips1002.wells()]
    tips_sn = tips1000.wells()[:num_samples]
    # load instruments
    m1000 = ctx.load_instrument(
        "flex_8channel_1000", mount, tip_racks=[tips1000, tips1001, tips1002]
    )

    """
    Here is where you can define the locations of your reagents.
    """
    lysis_ = res1.wells()[0]
    binding_buffer = res1.wells()[1:4]
    bind2_res = res1.wells()[4:6]
    wash1 = res1.wells()[6:8]
    elution_solution = res1.wells()[-1]
    wash2 = res2.wells()[:6]
    wash3 = res2.wells()[6:]

    samples_m = sample_plate.rows()[0][:num_cols]
    elution_samples_m = elutionplate.rows()[0][:num_cols]
    # Redefine per well for liquid definitions
    samps = sample_plate.wells()[: (8 * num_cols)]

    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Lysis": [{"well": lysis_, "volume": lysis_vol}],
        "PK": [{"well": lysis_, "volume": PK_vol}],
        "Beads": [{"well": binding_buffer, "volume": bead_vol}],
        "Binding": [{"well": binding_buffer, "volume": bind_vol}],
        "Binding 2": [{"well": bind2_res, "volume": bind2_vol}],
        "Wash 1": [{"well": wash1_vol, "volume": wash1}],
        "Wash 2": [{"well": wash2_vol, "volume": wash2}],
        "Wash 3": [{"well": wash3_vol, "volume": wash3}],
        "Final Elution": [{"well": elution_solution, "volume": elution_vol}],
        "Samples": [{"well": samps, "volume": 0}],
    }
    flattened_list_of_wells = helpers.find_liquid_height_of_loaded_liquids(
        ctx, liquid_vols_and_wells, m1000
    )

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    def tiptrack(tipbox: List[Well]) -> None:
        """Track Tips."""
        global tip1k
        global drop_count
        if tipbox == tips:
            m1000.pick_up_tip(tipbox[int(tip1k)])
            tip1k = tip1k + 8

        drop_count = drop_count + 8
        if drop_count >= 150:
            drop_count = 0
            ctx.pause("Please empty the waste bin of all the tips before continuing.")

    def remove_supernatant(vol: float) -> None:
        """Remove supernatant."""
        ctx.comment("-----Removing Supernatant-----")
        m1000.flow_rate.aspirate = 30
        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        for i, m in enumerate(samples_m):
            m1000.pick_up_tip(tips_sn[8 * i])
            loc = m.bottom(dot_bottom)
            for _ in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, m.top())
                m1000.move_to(m.center())
                m1000.transfer(vol_per_trans, loc, waste, new_tip="never", air_gap=20)
                m1000.blow_out(waste)
                m1000.air_gap(20)
            m1000.drop_tip(tips_sn[8 * i]) if TIP_TRASH else m1000.return_tip()
        m1000.flow_rate.aspirate = 300

        # Transfer from Magdeck plate to H-S
        helpers.move_labware_to_hs(ctx, sample_plate, h_s, h_s_adapter)

    def bead_mixing(
        well: Well, pip: InstrumentContext, mvol: float, reps: int = 8
    ) -> None:
        """Mixing.

        'mixing' will mix liquid that contains beads. This will be done by
        aspirating from the bottom of the well and dispensing from the top as to
        mix the beads with the other liquids as much as possible. Aspiration and
        dispensing will also be reversed for a short to to ensure maximal mixing.
        param well: The current well that the mixing will occur in.
        param pip: The pipet that is currently attached/ being used.
        param mvol: The volume that is transferred before the mixing steps.
        param reps: The number of mix repetitions that should occur. Note~
        During each mix rep, there are 2 cycles of aspirating from bottom,
        dispensing at the top and 2 cycles of aspirating from middle,
        dispensing at the bottom
        """
        center = well.top().move(types.Point(x=0, y=0, z=5))
        aspbot = well.bottom().move(types.Point(x=0, y=2, z=1))
        asptop = well.bottom().move(types.Point(x=0, y=-2, z=2))
        disbot = well.bottom().move(types.Point(x=0, y=2, z=3))
        distop = well.top().move(types.Point(x=0, y=1, z=-5))

        if mvol > 1000:
            mvol = 1000

        vol = mvol * 0.9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol, aspbot)
            pip.dispense(vol, distop)
            pip.aspirate(vol, asptop)
            pip.dispense(vol, disbot)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol, aspbot)
                pip.dispense(vol, aspbot)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def mixing(well: Well, pip: InstrumentContext, mvol: float, reps: int = 8) -> None:
        """Mixing.

        'mixing' will mix liquid that contains beads. This will be done by
        aspirating from the bottom of the well and dispensing from the top as to
        mix the beads with the other liquids as much as possible. Aspiration and
        dispensing will also be reversed for a short to to ensure maximal mixing.
        param well: The current well that the mixing will occur in.
        param pip: The pipet that is currently attached/ being used.
        param mvol: The volume that is transferred before the mixing steps.
        param reps: The number of mix repetitions that should occur. Note~
        During each mix rep, there are 2 cycles of aspirating from bottom,
        dispensing at the top and 2 cycles of aspirating from middle,
        dispensing at the bottom
        """
        center = well.top(5)
        asp = well.bottom(1)
        disp = well.top(-8)

        if mvol > 1000:
            mvol = 1000

        vol = mvol * 0.9

        pip.flow_rate.aspirate = 500
        pip.flow_rate.dispense = 500

        pip.move_to(center)
        for _ in range(reps):
            pip.aspirate(vol, asp)
            pip.dispense(vol, disp)
            pip.aspirate(vol, asp)
            pip.dispense(vol, disp)
            if _ == reps - 1:
                pip.flow_rate.aspirate = 150
                pip.flow_rate.dispense = 100
                pip.aspirate(vol, asp)
                pip.dispense(vol, asp)

        pip.flow_rate.aspirate = 300
        pip.flow_rate.dispense = 300

    def lysis(vol: float, source: Well) -> None:
        """Lysis."""
        ctx.comment("-----Beginning Lysis Steps-----")
        ctx.pause(msg="\n Hello \n - step 1 \n - step 2")
        num_transfers = math.ceil(vol / 980)
        tiptrack(tips)
        for i in range(num_cols):
            src = source
            tvol = vol / num_transfers
            # Mix Shield and PK before transferring first time
            if i == 0:
                for x in range(lysis_rep_1):
                    m1000.aspirate(vol, src.bottom(1))
                    m1000.dispense(vol, src.bottom(8))
            # Transfer Shield and PK
            for t in range(num_transfers):
                m1000.require_liquid_presence(src)
                m1000.aspirate(tvol, src.bottom(1))
                m1000.air_gap(10)
                m1000.dispense(m1000.current_volume, samples_m[i].top())

        # Mix shield and pk with samples
        for i in range(num_cols):
            if i != 0:
                tiptrack(tips)
            mixing(samples_m[i], m1000, tvol, reps=lysis_rep_2)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        helpers.set_hs_speed(ctx, h_s, heater_shaker_speed, lysis_incubation, True)

    def bind(vol1: float, vol2: float) -> None:
        """Binding.

        `bind` will perform magnetic bead binding on each sample in the
        deepwell plate. Each channel of binding beads will be mixed before
        transfer, and the samples will be mixed with the binding beads after
        the transfer. The magnetic deck activates after the addition to all
        samples, and the supernatant is removed after bead bining.
        :param vol (float): The amount of volume to aspirate from the elution
                            buffer source and dispense to each well containing
                            beads.
        :param park (boolean): Whether to save sample-corresponding tips
                               between adding elution buffer and transferring
                               supernatant to the final clean elutions PCR
                               plate.
        """
        ctx.comment("-----Beginning Binding Steps-----")
        for i, well in enumerate(samples_m):
            tiptrack(tips)
            num_trans = math.ceil(vol1 / 980)
            vol_per_trans = vol1 / num_trans
            source = binding_buffer[i // 2]
            if i == 0:
                reps = 5
            else:
                reps = 2
            bead_mixing(source, m1000, vol_per_trans, reps=reps if not dry_run else 1)
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.require_liquid_presence(source)
                m1000.transfer(
                    vol_per_trans, source, well.top(), air_gap=20, new_tip="never"
                )
                m1000.air_gap(20)
            bead_mixing(well, m1000, vol_per_trans, reps=bead_reps_2)
            m1000.blow_out()
            m1000.air_gap(10)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        helpers.set_hs_speed(ctx, h_s, heater_shaker_speed * 0.9, bind_time_1, True)

        # Transfer from H-S plate to Magdeck plate
        helpers.move_labware_from_hs_to_destination(ctx, sample_plate, h_s, magblock)

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            ctx.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol1 + starting_vol)

        ctx.comment("-----Beginning Bind #2 Steps-----")
        tiptrack(tips)
        for i, well in enumerate(samples_m):
            num_trans = math.ceil(vol2 / 980)
            vol_per_trans = vol2 / num_trans
            source = bind2_res[i // 3]
            if i == 0 or i == 3:
                height = 10
            else:
                height = 1
            # Transfer beads and binding from source to H-S plate
            for t in range(num_trans):
                if m1000.current_volume > 0:
                    # void air gap if necessary
                    m1000.dispense(m1000.current_volume, source.top())
                m1000.transfer(
                    vol_per_trans,
                    source.bottom(height),
                    well.top(),
                    air_gap=20,
                    new_tip="never",
                )
                m1000.air_gap(20)

        for i in range(num_cols):
            if i != 0:
                tiptrack(tips)
            bead_mixing(
                samples_m[i], m1000, vol_per_trans, reps=3 if not dry_run else 1
            )
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
        helpers.set_hs_speed(ctx, h_s, heater_shaker_speed, bind_time_2, True)

        # Transfer from H-S plate to Magdeck plate
        helpers.move_labware_from_hs_to_destination(ctx, sample_plate, h_s, magblock)

        for bindi in np.arange(
            settling_time + 1, 0, -0.5
        ):  # Settling time delay with countdown timer
            ctx.delay(
                minutes=0.5,
                msg="There are " + str(bindi) + " minutes left in the incubation.",
            )

        # remove initial supernatant
        remove_supernatant(vol2 + 25)

    def wash(vol: float, source: List[Well]) -> None:
        """Wash Steps."""
        global whichwash  # Defines which wash the protocol is on to log on the app

        if source == wash1:
            whichwash = 1
            const = 6 // len(source)
        if source == wash2:
            whichwash = 2
            const = 6 // len(source)
            height = 1
        if source == wash3:
            whichwash = 3
            const = 6 // len(source)
            height = 1

        ctx.comment("-----Wash #" + str(whichwash) + " is starting now------")

        num_trans = math.ceil(vol / 980)
        vol_per_trans = vol / num_trans

        tiptrack(tips)
        for i, m in enumerate(samples_m):
            if source == wash1:
                if i == 0 or i == 3:
                    height = 10
                else:
                    height = 1
            src = source[i // const]
            for n in range(num_trans):
                if m1000.current_volume > 0:
                    m1000.dispense(m1000.current_volume, src.top())
                m1000.require_liquid_presence(src)
                m1000.transfer(
                    vol_per_trans,
                    src.bottom(height),
                    m.top(),
                    air_gap=20,
                    new_tip="never",
                )
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()
        helpers.set_hs_speed(ctx, h_s, heater_shaker_speed * 0.9, wash_time, True)

        helpers.move_labware_from_hs_to_destination(ctx, sample_plate, h_s, magblock)

        for washi in np.arange(
            settling_time, 0, -0.5
        ):  # settling time timer for washes
            ctx.delay(
                minutes=0.5,
                msg="There are "
                + str(washi)
                + " minutes left in wash "
                + str(whichwash)
                + " incubation.",
            )

        remove_supernatant(vol)

    def elute(vol: float) -> None:
        tiptrack(tips)
        for i, m in enumerate(samples_m):
            m1000.require_liquid_presence(elution_solution)
            m1000.aspirate(vol, elution_solution)
            m1000.air_gap(20)
            m1000.dispense(m1000.current_volume, m.top(-3))
        m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        helpers.set_hs_speed(ctx, h_s, heater_shaker_speed * 0.9, wash_time, True)

        # Transfer back to magnet
        helpers.move_labware_from_hs_to_destination(ctx, sample_plate, h_s, magblock)

        for elutei in np.arange(settling_time, 0, -0.5):
            ctx.delay(
                minutes=0.5,
                msg="Incubating on MagDeck for " + str(elutei) + " more minutes.",
            )

        for i, (m, e) in enumerate(zip(samples_m, elution_samples_m)):
            tiptrack(tips)
            m1000.flow_rate.dispense = 100
            m1000.flow_rate.aspirate = 25
            m1000.transfer(
                vol, m.bottom(dot_bottom), e.bottom(5), air_gap=20, new_tip="never"
            )
            m1000.blow_out(e.top(-2))
            m1000.air_gap(20)
            m1000.drop_tip() if TIP_TRASH else m1000.return_tip()

        m1000.flow_rate.aspirate = 150

    """
    Here is where you can call the methods defined above to fit your specific
    protocol. The normal sequence is:
    """
    lysis(lysis_vol, lysis_)
    bind(binding_buffer_vol, bind2_vol)
    wash(wash1_vol, wash1)
    wash(wash2_vol, wash2)
    wash(wash3_vol, wash3)
    h_s.set_and_wait_for_temperature(55)
    for beaddry in np.arange(drybeads, 0, -0.5):
        ctx.delay(
            minutes=0.5,
            msg="There are " + str(beaddry) + " minutes left in the drying step.",
        )
    elute(elution_vol)
    h_s.deactivate_heater()
    flattened_list_of_wells.extend([waste_reservoir["A1"], elutionplate["A1"]])
    helpers.find_liquid_height_of_all_wells(ctx, m1000, flattened_list_of_wells)
