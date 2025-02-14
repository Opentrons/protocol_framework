from os import listdir

from opentrons.protocol_api import ProtocolContext, Well, ParameterContext, Labware
from opentrons_shared_data.load import get_shared_data_root

metadata = {"protocolName": "LLD 1000uL Tube-to-Tube"}
requirements = {"robotType": "Flex", "apiLevel": "2.22"}

SLOTS = {
    "tips": ["B3"],
    "src": "D2",
    "dst": "D3",
}

TARGET_UL = 1000
SUBMERGE_MM = -1.5

DST_TUBE = "opentrons_24_tuberack_nest_1.5ml_snapcap"  # measure weight (water + scale)

SRC_LABWARES = {
    1: {  # 1ch pipette
        "TUBES_2ML_SCREWCAP": "opentrons_24_tuberack_nest_2ml_screwcap",
        "TUBES_2ML_SNAPCAP": "opentrons_24_tuberack_nest_2ml_snapcap",
        "TUBES_1_5ML_SCREWCAP": "opentrons_24_tuberack_nest_1.5ml_screwcap",
        "TUBES_1_5ML_SNAPCAP": "opentrons_24_tuberack_nest_1.5ml_snapcap",
        "TUBES_15ML": "opentrons_15_tuberack_nest_15ml_conical",
        "TUBES_50ML": "opentrons_6_tuberack_nest_50ml_conical",
        "PLATE_200UL_PCR": "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "PLATE_200UL_FLAT": "nest_96_wellplate_200ul_flat",
        "PLATE_360UL_FLAT": "corning_96_wellplate_360ul_flat",
        "PLATE_2ML_DEEP": "nest_96_wellplate_2ml_deep",
    },
    8: {  # 8ch pipette
        "PLATE_15ML_RESERVOIR": "nest_12_reservoir_15ml",
    },
    96: {  # 96ch pipette
        "PLATE_195ML_RESERVOIR": "nest_1_reservoir_195ml",
        "PLATE_290ML_RESERVOIR": "nest_1_reservoir_290ml",
    },
}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        display_name="channels",
        variable_name="channels",
        default=1,
        choices=[
            {"display_name": "1", "value": 1},
            {"display_name": "8", "value": 8},
            {"display_name": "96", "value": 96},
        ],
    )
    parameters.add_str(
        display_name="labware",
        variable_name="labware",
        default=LABWARES[1]["TUBES_2ML_SCREWCAP"],
        choices=[
            {"display_name": label, "value": load_name}
            for info in LABWARES.values()
            for label, load_name in info.items()
        ],
    )
    # TODO: create run time parameter for min lld height


def get_latest_labware_version(load_name: str) -> int:
    labware_def_location = (
        f"{get_shared_data_root()}/labware/definitions/3/{load_name}/"
    )
    labware_def_latest = sorted(listdir(labware_def_location))[-1]
    return int(labware_def_latest[0])


def _load_labware(ctx: ProtocolContext, load_name: str, location: str, **kwargs) -> Labware:
    return ctx.load_labware(
        load_name=load_name,
        location=location,
        version=get_latest_labware_version(load_name),
        **kwargs,
    )


def run(ctx: ProtocolContext) -> None:
    # TODO: do we need to also load tip-rack adapters for 96ch,
    #       or does that happen automatically?
    channels = ctx.params.channels
    pipette = ctx.load_instrument(
        instrument_name=f"flex_{channels}channel_1000",
        mount="left",
        tip_racks=[
            _load_labware(ctx, f"opentrons_flex_96_tiprack_1000ul", SLOTS["tips"][i])
            for i in range(1)
        ]
    )

    labware = ctx.params.labware
    assert labware in list(LABWARES[pipette.channels].keys()), \
        f"{labware} cannot be tested with {pipette.channels}ch pipette"
    src = _load_labware(ctx, labware, SLOTS["src"])
    dst = _load_labware(ctx, DST_TUBE, SLOTS["dst"])

    # TODO: create the test:
    #         - tube is empty, ADD liquid
    #         - aspirate 1000uL (or less) using DYNAMIC-TRACKING
    #         - dispense into an EMPTY tube (1.5mL snapcap)
    # FUNCTIONS
    
    ## 1 - determine min LLD height 
    ## 2 - find volume between min lld height + 1.5 mm
    ## 3 - volume of min lld height + 1.5
    ## 4 - height of 1000 + 3
    ## 5 - start aspirating at 4
    # NOTE 1: Fill src_labware with dye in master reservoir 
    # NOTE 2: aspirate 1000 ul from src_labware - one tube at a time
        # put lid onto plate (do one at a time)
        # half will probe before the start of the aspirate (see if submerge depth can be smaller)
        # half will not
    # NOTE 3: dispense 1000 ul to X number of corning plate
        # put plate on heatershaker 
    # NOTE 4: read with artel - hv dye (goes above 200, no diluent)
    # NOTE 5: measure the mass of source plate 