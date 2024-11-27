"""Tartrazine Protocol."""
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well
from abr_testing.protocols import helpers
from opentrons.protocol_api.module_contexts import (
    AbsorbanceReaderContext,
    HeaterShakerContext,
)
from datetime import datetime
from typing import Dict, List
import statistics

metadata = {
    "protocolName": "Tartrazine Protocol",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {"robotType": "Flex", "apiLevel": "2.21"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="number_of_plates",
        display_name="Number of Plates",
        default=4,
        minimum=1,
        maximum=4,
    )


def run(ctx: ProtocolContext) -> None:
    """Protocol."""
    number_of_plates = ctx.params.number_of_plates  # type: ignore [attr-defined]
    # Plate Reader
    plate_reader: AbsorbanceReaderContext = ctx.load_module(
        helpers.abs_mod_str, "A3"
    )  # type: ignore[assignment]
    hs: HeaterShakerContext = ctx.load_module(helpers.hs_str, "A1")  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter")
    tube_rack = ctx.load_labware(
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "C2", "Reagent Tube"
    )
    tartrazine_tube = tube_rack["A3"]
    water_tube_1 = tube_rack["A4"]
    water_tube_2 = tube_rack["B3"]
    sample_plate_1 = ctx.load_labware(
        "corning_96_wellplate_360ul_flat", "D1", "Sample Plate 1"
    )
    sample_plate_2 = ctx.load_labware(
        "corning_96_wellplate_360ul_flat", "D2", "Sample Plate 2"
    )
    sample_plate_3 = ctx.load_labware(
        "corning_96_wellplate_360ul_flat", "C1", "Sample Plate 3"
    )
    sample_plate_4 = ctx.load_labware(
        "corning_96_wellplate_360ul_flat", "B1", "Sample Plate 4"
    )

    sample_plate_list = [sample_plate_1, sample_plate_2, sample_plate_3, sample_plate_4]
    tiprack_50_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    tiprack_50_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "C3")
    tiprack_50_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B3")
    tiprack_1000_1 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2")
    tip_racks = [tiprack_50_1, tiprack_50_2, tiprack_50_3]

    # Pipette
    p50 = ctx.load_instrument("flex_1channel_50", "left", tip_racks=tip_racks)
    p1000 = ctx.load_instrument(
        "flex_1channel_1000", "right", tip_racks=[tiprack_1000_1]
    )

    # Probe wells
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Tartrazine": [{"well": tartrazine_tube, "volume": 45.0}],
        "Water": [{"well": [water_tube_1, water_tube_2], "volume": 45.0}],
    }
    helpers.find_liquid_height_of_loaded_liquids(ctx, liquid_vols_and_wells, p50)

    i = 0
    all_percent_error_dict = {}
    cv_dict = {}
    vol = 0.0
    tip_count = 0
    for sample_plate in sample_plate_list[:number_of_plates]:
        deck_locations = ["D1", "D2", "C1", "B1"]
        p1000.pick_up_tip()
        for well in sample_plate.wells():
            if vol < 45000:
                tube_of_choice = water_tube_1
            else:
                tube_of_choice = water_tube_2
            p50.pick_up_tip()
            p1000.aspirate(190, tube_of_choice)
            p1000.air_gap(5)
            p1000.dispense(5, well.top())
            p1000.dispense(190, well)
            vol += 190
            height = helpers.find_liquid_height(p50, tartrazine_tube)
            p50.aspirate(10, tartrazine_tube.bottom(z=height))
            p50.air_gap(5)
            p50.dispense(5, well.top())
            p50.dispense(10, well.bottom(z=0.5))
            p50.blow_out()
            p50.return_tip()
            tip_count += 1
            if tip_count >= (96 * 3):
                p50.reset_tipracks()
        p1000.return_tip()
        helpers.move_labware_to_hs(ctx, sample_plate, hs, hs_adapter)
        helpers.set_hs_speed(ctx, hs, 1500, 2.0, True)
        hs.open_labware_latch()
        plate_reader.close_lid()
        plate_reader.initialize("single", [450])
        plate_reader.open_lid()
        ctx.move_labware(sample_plate, plate_reader, use_gripper=True)
        sample_plate_name = "sample plate_" + str(i + 1)
        csv_string = sample_plate_name + "_" + str(datetime.now())
        plate_reader.close_lid()
        result = plate_reader.read(csv_string)
        for wavelength in result:
            dict_of_wells = result[wavelength]
            readings_and_wells = dict_of_wells.items()
            readings = dict_of_wells.values()
            avg = statistics.mean(readings)
            # Check if every average is within +/- 5% of 2.85
            percent_error_dict = {}
            percent_error_sum = 0.0
            for reading in readings_and_wells:
                well_name = str(reading[0])
                measurement = reading[1]
                percent_error = (measurement - 2.85) / 2.85 * 100
                percent_error_dict[well_name] = percent_error
                percent_error_sum += percent_error
            avg_percent_error = percent_error_sum / 96.0
            standard_deviation = statistics.stdev(readings)
            try:
                cv = standard_deviation / avg
            except ZeroDivisionError:
                cv = 0.0
            cv_percent = cv * 100
            cv_dict[sample_plate_name] = {
                "CV": cv_percent,
                "Mean": avg,
                "SD": standard_deviation,
                "Avg Percent Error": avg_percent_error,
            }
        all_percent_error_dict[sample_plate_name] = percent_error_dict
        plate_reader.open_lid()
        ctx.move_labware(sample_plate, deck_locations[i], use_gripper=True)
        i += 1
    # Print percent error dictionary
    ctx.comment("Percent Error: " + str(all_percent_error_dict))
    # Print cv dictionary
    ctx.comment("Plate Reader result: " + str(cv_dict))
