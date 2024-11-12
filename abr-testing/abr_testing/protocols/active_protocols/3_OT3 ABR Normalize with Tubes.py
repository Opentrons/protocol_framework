"""FLEX Normalize with Tubes."""
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well
from abr_testing.protocols import helpers
from typing import List

metadata = {
    "protocolName": "Flex Normalize with Tubes",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.20"}

# SCRIPT SETTINGS
ABR_TEST = True
if ABR_TEST:
    DRYRUN = True  # True = skip incubation times, shorten mix, for testing purposes
    TIP_TRASH = (
        False  # True = Used tips go in Trash, False = Used tips go back into rack
    )
else:
    DRYRUN = False  # True = skip incubation times, shorten mix, for testing purposes
    TIP_TRASH = True


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_csv_parameter(parameters)
    helpers.create_dot_bottom_parameter(parameters)
    helpers.create_two_pipette_mount_parameters(parameters)


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    mount_pos_50ul = ctx.params.pipette_mount_1  # type: ignore[attr-defined]
    mount_pos_1000ul = ctx.params.pipette_mount_2  # type: ignore[attr-defined]
    dot_bottom = ctx.params.dot_bottom  # type: ignore[attr-defined]
    parsed_csv = ctx.params.parameters_csv.parse_as_csv()  # type: ignore[attr-defined]
    if DRYRUN:
        ctx.comment("THIS IS A DRY RUN")
    else:
        ctx.comment("THIS IS A REACTION RUN")

    # labware
    tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "1")
    tiprack_200_1 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "4")
    reagent_tube = ctx.load_labware(
        "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical", "5", "Reagent Tube"
    )
    sample_plate = ctx.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "2", "Sample Plate"
    )

    # reagent
    RSB = reagent_tube.wells()[0]

    # pipette
    p1000 = ctx.load_instrument(
        "flex_1channel_1000", mount_pos_1000ul, tip_racks=[tiprack_200_1]
    )
    p50 = ctx.load_instrument(
        "flex_1channel_50", mount_pos_50ul, tip_racks=[tiprack_50_1]
    )

    wells_with_liquids: List[Well] = [RSB]
    helpers.load_wells_with_water(ctx, wells_with_liquids, [4000.0])
    helpers.find_liquid_height_of_all_wells(ctx, p50, wells_with_liquids)
    MaxTubeVol = 200
    RSBVol = 0.0

    data = parsed_csv
    current = 1
    while current < len(data):

        CurrentWell = str(data[current][1])
        if float(data[current][2]) > 0:
            InitialVol = float(data[current][2])
        else:
            InitialVol = 0
        if float(data[current][3]) > 0:
            InitialConc = float(data[current][3])
        else:
            InitialConc = 0
        if float(data[current][4]) > 0:
            TargetConc = float(data[current][4])
        else:
            TargetConc = 0
        TotalDNA = float(InitialConc * InitialVol)
        if TargetConc > 0:
            TargetVol = float(TotalDNA / TargetConc)
        else:
            TargetVol = InitialVol
        if TargetVol > InitialVol:
            DilutionVol = float(TargetVol - InitialVol)
        else:
            DilutionVol = 0
        FinalVol = float(DilutionVol + InitialVol)
        if TotalDNA > 0 and FinalVol > 0:
            FinalConc = float(TotalDNA / FinalVol)
        else:
            FinalConc = 0

        if DilutionVol <= 1:
            ctx.comment("Sample " + CurrentWell + ": Conc. Too Low, Will Skip")
        elif DilutionVol > MaxTubeVol - InitialVol:
            DilutionVol = MaxTubeVol - InitialVol
            ctx.comment(
                "Sample "
                + CurrentWell
                + ": Conc. Too High, Will add, "
                + str(DilutionVol)
                + "ul, Max = "
                + str(MaxTubeVol)
                + "ul"
            )
            RSBVol += MaxTubeVol - InitialVol
        else:
            if DilutionVol <= 20:
                ctx.comment(
                    "Sample "
                    + CurrentWell
                    + ": Using p50, will add "
                    + str(round(DilutionVol, 1))
                )
            elif DilutionVol > 20:
                ctx.comment(
                    "Sample "
                    + CurrentWell
                    + ": Using p1000, will add "
                    + str(round(DilutionVol, 1))
                )
            RSBVol += DilutionVol
        current += 1

    if RSBVol >= 14000:
        ctx.pause("Caution, more than 15ml Required")
    else:
        ctx.comment("RSB Minimum: " + str(round(RSBVol / 1000, 1) + 1) + "ml")

    PiR2 = 176.71
    InitialRSBVol = RSBVol
    RSBHeight = (InitialRSBVol / PiR2) + 17.5

    ctx.pause("Proceed")
    ctx.comment("==============================================")
    ctx.comment("Normalizing Samples")
    ctx.comment("==============================================")

    current = 1
    while current < len(data):

        CurrentWell = str(data[current][1])
        if float(data[current][2]) > 0:
            InitialVol = float(data[current][2])
        else:
            InitialVol = 0
        if float(data[current][3]) > 0:
            InitialConc = float(data[current][3])
        else:
            InitialConc = 0
        if float(data[current][4]) > 0:
            TargetConc = float(data[current][4])
        else:
            TargetConc = 0
        TotalDNA = float(InitialConc * InitialVol)
        if TargetConc > 0:
            TargetVol = float(TotalDNA / TargetConc)
        else:
            TargetVol = InitialVol
        if TargetVol > InitialVol:
            DilutionVol = float(TargetVol - InitialVol)
        else:
            DilutionVol = 0
        FinalVol = float(DilutionVol + InitialVol)
        if TotalDNA > 0 and FinalVol > 0:
            FinalConc = float(TotalDNA / FinalVol)
        else:
            FinalConc = 0

        ctx.comment("Number " + str(data[current]) + ": Sample " + str(CurrentWell))
        #        ctx.comment("Vol Height = "+str(round(RSBHeight,2)))
        HeightDrop = DilutionVol / PiR2
        #        ctx.comment("Vol Drop = "+str(round(HeightDrop,2)))

        if DilutionVol <= 0:
            # If the No Volume
            ctx.comment("Conc. Too Low, Skipping")

        elif DilutionVol >= MaxTubeVol - InitialVol:
            # If the Required Dilution volume is >= Max Volume
            DilutionVol = MaxTubeVol - InitialVol
            ctx.comment(
                "Conc. Too High, Will add, "
                + str(DilutionVol)
                + "ul, Max = "
                + str(MaxTubeVol)
                + "ul"
            )
            p1000.pick_up_tip()
            p1000.require_liquid_presence(RSB)
            p1000.aspirate(DilutionVol, RSB.bottom(RSBHeight - (HeightDrop)))
            RSBHeight -= HeightDrop
            #            ctx.comment("New Vol Height = "+str(round(RSBHeight,2)))
            p1000.dispense(DilutionVol, sample_plate.wells_by_name()[CurrentWell])
            wells_with_liquids.append(sample_plate.wells_by_name()[CurrentWell])
            HighVolMix = 10
            for Mix in range(HighVolMix):
                p1000.move_to(sample_plate.wells_by_name()[CurrentWell].center())
                p1000.aspirate(100)
                p1000.move_to(
                    sample_plate.wells_by_name()[CurrentWell].bottom(0.5)
                )  # original = ()
                p1000.aspirate(100)
                p1000.dispense(100)
                p1000.move_to(sample_plate.wells_by_name()[CurrentWell].center())
                p1000.dispense(100)
                wells_with_liquids.append(sample_plate.wells_by_name()[CurrentWell])
                Mix += 1
            p1000.move_to(sample_plate.wells_by_name()[CurrentWell].top())
            ctx.delay(seconds=3)
            p1000.blow_out()
            p1000.drop_tip() if DRYRUN is False else p1000.return_tip()

        else:
            if DilutionVol <= 20:
                # If the Required Dilution volume is <= 20ul
                ctx.comment("Using p50 to add " + str(round(DilutionVol, 1)))
                p50.pick_up_tip()
                if round(float(data[current][3]), 1) <= 20:
                    p50.require_liquid_presence(RSB)
                    p50.aspirate(DilutionVol, RSB.bottom(RSBHeight - (HeightDrop)))
                    RSBHeight -= HeightDrop
                else:
                    p50.require_liquid_presence(RSB)
                    p50.aspirate(20, RSB.bottom(RSBHeight - (HeightDrop)))
                    RSBHeight -= HeightDrop
                p50.dispense(DilutionVol, sample_plate.wells_by_name()[CurrentWell])
                wells_with_liquids.append(sample_plate.wells_by_name()[CurrentWell])
                p50.move_to(
                    sample_plate.wells_by_name()[CurrentWell].bottom(z=dot_bottom)
                )  # original = ()
                # Mix volume <=20ul
                if DilutionVol + InitialVol <= 20:
                    p50.mix(10, DilutionVol + InitialVol)
                elif DilutionVol + InitialVol > 20:
                    p50.mix(10, 20)
                p50.move_to(sample_plate.wells_by_name()[CurrentWell].top())
                ctx.delay(seconds=3)
                p50.blow_out()
                p50.drop_tip() if DRYRUN is False else p50.return_tip()

            elif DilutionVol > 20:
                # If the required volume is >20
                ctx.comment("Using p1000 to add " + str(round(DilutionVol, 1)))
                p1000.pick_up_tip()
                p1000.require_liquid_presence(RSB)
                p1000.aspirate(DilutionVol, RSB.bottom(RSBHeight - (HeightDrop)))
                RSBHeight -= HeightDrop
                if DilutionVol + InitialVol >= 120:
                    HighVolMix = 10
                    for Mix in range(HighVolMix):
                        p1000.move_to(
                            sample_plate.wells_by_name()[CurrentWell].center()
                        )
                        p1000.aspirate(100)
                        p1000.move_to(
                            sample_plate.wells_by_name()[CurrentWell].bottom(
                                z=dot_bottom
                            )
                        )  # original = ()
                        p1000.aspirate(DilutionVol + InitialVol - 100)
                        p1000.dispense(100)
                        p1000.move_to(
                            sample_plate.wells_by_name()[CurrentWell].center()
                        )
                        p1000.dispense(DilutionVol + InitialVol - 100)
                        Mix += 1
                        wells_with_liquids.append(
                            sample_plate.wells_by_name()[CurrentWell]
                        )
                else:
                    p1000.dispense(
                        DilutionVol, sample_plate.wells_by_name()[CurrentWell]
                    )
                    p1000.move_to(
                        sample_plate.wells_by_name()[CurrentWell].bottom(z=dot_bottom)
                    )  # original = ()
                    p1000.mix(10, DilutionVol + InitialVol)
                    p1000.move_to(sample_plate.wells_by_name()[CurrentWell].top())
                    wells_with_liquids.append(sample_plate.wells_by_name()[CurrentWell])
                ctx.delay(seconds=3)
                p1000.blow_out()
                p1000.drop_tip() if DRYRUN is False else p1000.return_tip()
        current += 1

    ctx.comment("==============================================")
    ctx.comment("Results")
    ctx.comment("==============================================")

    current = 1
    while current < len(data):

        CurrentWell = str(data[current][1])
        if float(data[current][2]) > 0:
            InitialVol = float(data[current][2])
        else:
            InitialVol = 0
        if float(data[current][3]) > 0:
            InitialConc = float(data[current][3])
        else:
            InitialConc = 0
        if float(data[current][4]) > 0:
            TargetConc = float(data[current][4])
        else:
            TargetConc = 0
        TotalDNA = float(InitialConc * InitialVol)
        if TargetConc > 0:
            TargetVol = float(TotalDNA / TargetConc)
        else:
            TargetVol = InitialVol
        if TargetVol > InitialVol:
            DilutionVol = float(TargetVol - InitialVol)
        else:
            DilutionVol = 0
        if DilutionVol > MaxTubeVol - InitialVol:
            DilutionVol = MaxTubeVol - InitialVol
        FinalVol = float(DilutionVol + InitialVol)
        if TotalDNA > 0 and FinalVol > 0:
            FinalConc = float(TotalDNA / FinalVol)
        else:
            FinalConc = 0
        ctx.comment(
            "Sample "
            + CurrentWell
            + ": "
            + str(round(FinalVol, 1))
            + " at "
            + str(round(FinalConc, 1))
            + "ng/ul"
        )

        current += 1
    print(wells_with_liquids)
    helpers.find_liquid_height_of_all_wells(ctx, p50, wells_with_liquids)
