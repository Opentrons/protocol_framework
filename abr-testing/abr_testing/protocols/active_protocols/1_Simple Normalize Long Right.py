"""Simple Normalize Long with LPD and Single Tip."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Labware,
    SINGLE,
    InstrumentContext,
    Well,
)
from abr_testing.protocols import helpers
from typing import List, Dict

metadata = {
    "protocolName": "Simple Normalize Long with LPD and Single Tip",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.21",
}


def add_parameters(parameters: ParameterContext) -> None:
    """Parameters."""
    helpers.create_single_pipette_mount_parameter(parameters)
    helpers.create_tip_size_parameter(parameters)


def get_next_tip_by_row(tip_rack: Labware, pipette: InstrumentContext) -> Well | None:
    """Get next tip by row.

    This function returns the well name of the next tip to pick up for a given
    tiprack with row-bias. Returns None if the pipette is out of tips
    """
    if tip_rack.is_tiprack:
        if pipette.channels == 8:
            for passes in range(
                0, int(len(tip_rack.columns()[0]) / pipette.active_channels)
            ):
                for column in tip_rack.columns():
                    # When the pipette's starting channels is H1, consume tips starting at top row.
                    if pipette._core.get_nozzle_map().starting_nozzle == "H1":
                        active_column = column
                    else:
                        # We reverse our tiprack reference to consume tips starting at bottom.
                        active_column = column[::-1]

                    if len(active_column) >= (
                        ((pipette.active_channels * passes) + pipette.active_channels)
                    ) and all(
                        well.has_tip is True
                        for well in active_column[
                            (pipette.active_channels * passes) : (
                                (
                                    (pipette.active_channels * passes)
                                    + pipette.active_channels
                                )
                            )
                        ]
                    ):
                        return active_column[
                            (
                                (pipette.active_channels * passes)
                                + (pipette.active_channels - 1)
                            )
                        ]
            # No valid tips were found for current pipette configuration in provided tip rack.
            return None
        else:
            raise ValueError(
                "Parameter 'pipette' of get_next_tip_by_row must be an 8 Channel Pipette."
            )
    else:
        raise ValueError(
            "Parameter 'tip_rack' of get_next_tip_by_row must be a recognized Tip Rack labware."
        )


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    tip_type = protocol.params.tip_size  # type: ignore[attr-defined]
    mount_pos = protocol.params.pipette_mount  # type: ignore[attr-defined]
    # DECK SETUP AND LABWARE
    protocol.comment("THIS IS A NO MODULE RUN")
    tiprack_x_1 = protocol.load_labware(tip_type, "D1")
    tiprack_x_2 = protocol.load_labware(tip_type, "D2")
    tiprack_x_3 = protocol.load_labware(tip_type, "B1")
    sample_plate_1 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D3"
    )

    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "B3")
    sample_plate_2 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    sample_plate_3 = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "B2"
    )
    protocol.load_trash_bin("A3")

    # reagent
    Dye_1 = reservoir["A1"]
    Dye_2 = reservoir["A2"]
    Dye_3 = reservoir["A3"]
    Diluent_1 = reservoir["A4"]
    Diluent_2 = reservoir["A5"]

    # pipette
    p1000 = protocol.load_instrument(
        "flex_8channel_1000", mount_pos, liquid_presence_detection=True
    )
    # LOAD LIQUIDS
    liquid_volumes = [675.0, 675.0, 675.0, 675.0, 675.0]
    wells = [Dye_1, Dye_2, Dye_3, Diluent_1, Diluent_2]
    helpers.load_wells_with_water(protocol, wells, liquid_volumes)
    liquid_vols_and_wells: Dict[str, List[Dict[str, Well | List[Well] | float]]] = {
        "Dye": [{"well": [Dye_1, Dye_2, Dye_3], "volume": 675.0}],
        "Diluent": [{"well": [Diluent_1, Diluent_2], "volume": 675.0}],
    }
    current_rack = tiprack_x_1
    # CONFIGURE SINGLE LAYOUT
    p1000.configure_nozzle_layout(
        style=SINGLE, start="H1", tip_racks=[tiprack_x_1, tiprack_x_2, tiprack_x_3]
    )
    helpers.find_liquid_height_of_loaded_liquids(protocol, liquid_vols_and_wells, p1000)
    sample_quant_csv = """
    sample_plate_1, Sample_well,DYE,DILUENT
    sample_plate_1,A1,0,100
    sample_plate_1,B1,5,95
    sample_plate_1,C1,10,90
    sample_plate_1,D1,20,80
    sample_plate_1,E1,40,60
    sample_plate_1,F1,15,40
    sample_plate_1,G1,40,20
    sample_plate_1,H1,40,0
    sample_plate_1,A2,35,65
    sample_plate_1,B2,38,42
    sample_plate_1,C2,42,58
    sample_plate_1,D2,32,8
    sample_plate_1,E2,38,12
    sample_plate_1,F2,26,74
    sample_plate_1,G2,31,69
    sample_plate_1,H2,46,4
    sample_plate_1,A3,47,13
    sample_plate_1,B3,42,18
    sample_plate_1,C3,46,64
    sample_plate_1,D3,48,22
    sample_plate_1,E3,26,74
    sample_plate_1,F3,34,66
    sample_plate_1,G3,43,37
    sample_plate_1,H3,20,80
    sample_plate_1,A4,44,16
    sample_plate_1,B4,49,41
    sample_plate_1,C4,48,42
    sample_plate_1,D4,44,16
    sample_plate_1,E4,47,53
    sample_plate_1,F4,47,33
    sample_plate_1,G4,42,48
    sample_plate_1,H4,39,21
    sample_plate_1,A5,30,20
    sample_plate_1,B5,36,14
    sample_plate_1,C5,31,59
    sample_plate_1,D5,38,52
    sample_plate_1,E5,36,4
    sample_plate_1,F5,32,28
    sample_plate_1,G5,35,55
    sample_plate_1,H5,39,1
    sample_plate_1,A6,31,59
    sample_plate_1,B6,20,80
    sample_plate_1,C6,38,2
    sample_plate_1,D6,34,46
    sample_plate_1,E6,30,70
    sample_plate_1,F6,32,58
    sample_plate_1,G6,21,79
    sample_plate_1,H6,38,52
    sample_plate_1,A7,33,27
    sample_plate_1,B7,34,16
    sample_plate_1,C7,40,60
    sample_plate_1,D7,34,26
    sample_plate_1,E7,30,20
    sample_plate_1,F7,44,56
    sample_plate_1,G7,26,74
    sample_plate_1,H7,45,55
    sample_plate_1,A8,39,1
    sample_plate_1,B8,38,2
    sample_plate_1,C8,34,66
    sample_plate_1,D8,39,11
    sample_plate_1,E8,46,54
    sample_plate_1,F8,37,63
    sample_plate_1,G8,38,42
    sample_plate_1,H8,34,66
    sample_plate_1,A9,44,56
    sample_plate_1,B9,39,11
    sample_plate_1,C9,30,70
    sample_plate_1,D9,37,33
    sample_plate_1,E9,46,54
    sample_plate_1,F9,39,21
    sample_plate_1,G9,29,41
    sample_plate_1,H9,23,77
    sample_plate_1,A10,26,74
    sample_plate_1,B10,39,1
    sample_plate_1,C10,31,49
    sample_plate_1,D10,38,62
    sample_plate_1,E10,29,1
    sample_plate_1,F10,21,79
    sample_plate_1,G10,29,41
    sample_plate_1,H10,28,42
    sample_plate_1,A11,15,55
    sample_plate_1,B11,28,72
    sample_plate_1,C11,11,49
    sample_plate_1,D11,34,66
    sample_plate_1,E11,27,73
    sample_plate_1,F11,30,40
    sample_plate_1,G11,33,67
    sample_plate_1,H11,31,39
    sample_plate_1,A12,39,31
    sample_plate_1,B12,47,53
    sample_plate_1,C12,46,54
    sample_plate_1,D12,13,7
    sample_plate_1,E12,34,46
    sample_plate_1,F12,45,35
    sample_plate_1,G12,28,42
    sample_plate_1,H12,37,63
    """

    data = [r.split(",") for r in sample_quant_csv.strip().splitlines() if r][1:]
    for X in range(1):
        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 1")
        protocol.comment("==============================================")

        current = 0

        well = get_next_tip_by_row(current_rack, p1000)
        p1000.pick_up_tip(well)
        while current < len(data):
            CurrentWell = str(data[current][1])
            DyeVol = float(data[current][2])
            if DyeVol != 0 and DyeVol < 100:
                p1000.liquid_presence_detection = False
                p1000.transfer(
                    DyeVol,
                    Dye_1.bottom(z=2),
                    sample_plate_1.wells_by_name()[CurrentWell].top(z=1),
                    new_tip="never",
                )
                if DyeVol > 20:
                    wells.append(sample_plate_1.wells_by_name()[CurrentWell])
            current += 1
        p1000.blow_out()
        p1000.touch_tip()
        p1000.drop_tip()
        p1000.liquid_presence_detection = True

        protocol.comment("==============================================")
        protocol.comment("Adding Diluent Sample Plate 1")
        protocol.comment("==============================================")

        current = 0
        while current < len(data):
            CurrentWell = str(data[current][1])
            DilutionVol = float(data[current][2])
            if DilutionVol != 0 and DilutionVol < 100:
                well = get_next_tip_by_row(current_rack, p1000)
                p1000.pick_up_tip(well)
                p1000.aspirate(DilutionVol, Diluent_1.bottom(z=2))
                p1000.dispense(
                    DilutionVol, sample_plate_1.wells_by_name()[CurrentWell].top(z=0.2)
                )
                if DilutionVol > 20:
                    wells.append(sample_plate_1.wells_by_name()[CurrentWell])
                p1000.blow_out()
                p1000.touch_tip()
                p1000.drop_tip()
            current += 1

        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 2")
        protocol.comment("==============================================")

        current = 0
        well = get_next_tip_by_row(tiprack_x_2, p1000)
        p1000.pick_up_tip(well)
        while current < len(data):
            CurrentWell = str(data[current][1])
            DyeVol = float(data[current][2])
            if DyeVol != 0 and DyeVol < 100:
                p1000.transfer(
                    DyeVol,
                    Dye_2.bottom(z=2),
                    sample_plate_2.wells_by_name()[CurrentWell].top(z=1),
                    new_tip="never",
                )
                if DyeVol > 20:
                    wells.append(sample_plate_2.wells_by_name()[CurrentWell])
            current += 1
        p1000.blow_out()
        p1000.touch_tip()
        p1000.drop_tip()

        protocol.comment("==============================================")
        protocol.comment("Adding Diluent Sample Plate 2")
        protocol.comment("==============================================")

        current = 0
        while current < len(data):
            CurrentWell = str(data[current][1])
            DilutionVol = float(data[current][2])
            if DilutionVol != 0 and DilutionVol < 100:
                well = get_next_tip_by_row(tiprack_x_2, p1000)
                p1000.pick_up_tip(well)
                p1000.aspirate(DilutionVol, Diluent_2.bottom(z=2))
                p1000.dispense(
                    DilutionVol, sample_plate_2.wells_by_name()[CurrentWell].top(z=0.2)
                )
                if DilutionVol > 20:
                    wells.append(sample_plate_2.wells_by_name()[CurrentWell])
                p1000.blow_out()
                p1000.touch_tip()
                p1000.drop_tip()
            current += 1

        protocol.comment("==============================================")
        protocol.comment("Adding Dye Sample Plate 3")
        protocol.comment("==============================================")

        current = 0
        well = get_next_tip_by_row(tiprack_x_3, p1000)
        p1000.pick_up_tip(well)
        while current < len(data):
            CurrentWell = str(data[current][1])
            DyeVol = float(data[current][2])
            if DyeVol != 0 and DyeVol < 100:
                p1000.liquid_presence_detection = False
                p1000.transfer(
                    DyeVol,
                    Dye_3.bottom(z=2),
                    sample_plate_3.wells_by_name()[CurrentWell].top(z=1),
                    blow_out=True,
                    blowout_location="destination well",
                    new_tip="never",
                )
                if DyeVol > 20:
                    wells.append(sample_plate_3.wells_by_name()[CurrentWell])
            current += 1
        p1000.liquid_presence_detection = True
        p1000.blow_out()
        p1000.touch_tip()
        p1000.drop_tip()
        protocol.comment("==============================================")
        protocol.comment("Adding Diluent Sample Plate 3")
        protocol.comment("==============================================")

        current = 0
        # Probe heights
        helpers.find_liquid_height_of_all_wells(protocol, p1000, wells)
