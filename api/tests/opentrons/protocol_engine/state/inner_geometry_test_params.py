
"""
Each labware has 2 nominal volumes calculated in solidworks.
- One is a nominal bottom volume, calculated some set distance from the bottom of the inside of the well.
- The other is a nominal top volume, calculated some set distance from the top of the inside of the well.
"""
labware_to_test = [
    # "opentrons_96_aluminumblock_generic_pcr_strip_200ul",
    # "opentrons_24_tuberack_generic_2ml_screwcap",
    "appliedbiosystemsmicroamp_384_wellplate_40ul",
    "biorad_384_wellplate_50ul",
    "corning_96_wellplate_360ul_flat",
    "corning_384_wellplate_112ul_flat",
    "axygen_1_reservoir_90ml",
    "biorad_96_wellplate_200ul_pcr",
    "corning_48_wellplate_1.6ml_flat",
    "corning_6_wellplate_16.8ml_flat",
    "corning_24_wellplate_3.4ml_flat",
    "corning_12_wellplate_6.9ml_flat",
    "thermoscientificnunc_96_wellplate_1300ul",
    "opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap",
    "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap",
    "agilent_1_reservoir_290ml",
    "usascientific_96_wellplate_2.4ml_deep",
    "thermoscientificnunc_96_wellplate_2000ul",
    "usascientific_12_reservoir_22ml",
    "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical-15mL-ONLY",
    "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical-50mL-ONLY",
    "nest_96_wellplate_200ul_flat",
    "nest_96_wellplate_100ul_pcr_full_skirt",
    "opentrons_96_wellplate_200ul_pcr_full_skirt",
    "opentrons_24_tuberack_nest_0.5ml_screwcap",
    "nest_1_reservoir_195ml",
    "nest_12_reservoir_15ml",
    "opentrons_24_tuberack_nest_1.5ml_snapcap",
    "nest_96_wellplate_2ml_deep",
    "opentrons_24_tuberack_nest_2ml_snapcap",
    "nest_1_reservoir_290ml",
    "opentrons_24_tuberack_nest_1.5ml_screwcap",
    "opentrons_24_tuberack_nest_2ml_screwcap",
    "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical-50mL-ONLY",
    "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical-15mL-ONLY"
]
print(f"len of list = {len(labware_to_test)}")
print(f"len of set = {len(set(labware_to_test))}")


INNER_WELL_GEOMETRY_TEST_PARAMS = [
    [
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical",
        "conicalWell15mL",
        16.7,
        15546.9,
        3.0,
        5.0,
    ],
    [
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical",
        "conicalWell50mL",
        111.2,
        56110.3,
        3.0,
        5.0,
    ],
    ["opentrons_24_tuberack_nest_2ml_screwcap", "conicalWell", 66.6, 2104.9, 3.0, 3.0],
    [
        "opentrons_24_tuberack_nest_1.5ml_screwcap",
        "conicalWell",
        19.5,
        1750.8,
        3.0,
        3.0,
    ],
    # weird one
    [
      "nest_1_reservoir_290ml", "cuboidalWell", 16570.380, 271690.520, 3.0, 3.0
    ],
    # failing isclose
    [
        "opentrons_24_tuberack_nest_2ml_snapcap", "conicalWell", 69.62, 2148.5, 3.0, 3.0
    ],
    ["nest_96_wellplate_2ml_deep", "cuboidalWell", 118.3, 2060.4, 3.0, 3.0],
    ["opentrons_24_tuberack_nest_1.5ml_snapcap", "conicalWell", 27.8, 1682.3, 3.0, 3.0],
    ["nest_12_reservoir_15ml", "cuboidalWell", 1219.0, 13236.1, 3.0, 3.0],
    # weird one
    [
        "nest_1_reservoir_195ml", "cuboidalWell", 14034.2, 172301.9, 3.0, 3.0
    ],
    [
        "opentrons_24_tuberack_nest_0.5ml_screwcap",
        "conicalWell",
        21.95,
        795.4,
        3.0,
        3.0,
    ],
    [
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "conicalWell",
        14.3,
        150.2,
        3.0,
        3.0,
    ],
    ["nest_96_wellplate_100ul_pcr_full_skirt", "conicalWell", 15.5, 150.8, 3.0, 3.0],
    ["nest_96_wellplate_200ul_flat", "conicalWell", 96.3, 259.8, 3.0, 3.0],
    [
        "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical",
        "50mlconicalWell",
        163.9,
        57720.5,
        3.0,
        3.0,
    ],
    [
        "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical",
        "15mlconicalWell",
        40.8,
        15956.6,
        3.0,
        3.0,
    ],
    # failed - squared cone
    [
        "usascientific_12_reservoir_22ml", "cuboidalWell", 61.6, 21111.5, 3.0, 3.0
    ],
    ["thermoscientificnunc_96_wellplate_2000ul", "conicalWell", 73.5, 1768.0, 3.0, 3.0],
    # skipped usascientific_96_wellplate_2.4ml_deep since it doesnt have a definition yet
    # weird one
    [
        "agilent_1_reservoir_290ml", "cuboidalWell", 15652.9, 268813.8, 3.0, 3.0
    ],
    [
        "opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap",
        "conicalWell",
        25.8,
        1576.1,
        3.0,
        3.0,
    ],
    ["thermoscientificnunc_96_wellplate_1300ul", "conicalWell", 73.5, 1155.1, 3.0, 3.0],
    ["corning_12_wellplate_6.9ml_flat", "conicalWell", 1156.3, 5654.8, 3.0, 3.0],
    ["corning_24_wellplate_3.4ml_flat", "conicalWell", 579.0, 2853.4, 3.0, 3.0],
    ["corning_6_wellplate_16.8ml_flat", "conicalWell", 2862.1, 13901.9, 3.0, 3.0],
    ["corning_48_wellplate_1.6ml_flat", "conicalWell", 268.9, 1327.0, 3.0, 3.0],
    ["biorad_96_wellplate_200ul_pcr", "conicalWell", 17.9, 161.2, 3.0, 3.0],
    ["axygen_1_reservoir_90ml", "cuboidalWell", 22373.4, 70450.6, 3.0, 3.0],
    # fails- this one thought it was a rectangle ?
    [
        "corning_384_wellplate_112ul_flat", "flatWell", 22.4, 77.4, 2.88, 3.0
    ],
    ["corning_96_wellplate_360ul_flat", "conicalWell", 97.2, 257.1, 3.0, 3.0],
    ["biorad_384_wellplate_50ul", "conicalWell", 7.7, 27.8, 3.0, 3.0],
    [
        "appliedbiosystemsmicroamp_384_wellplate_40ul",
        "conicalWell",
        7.44,
        26.2,
        3.0,
        3.0,
    ],
]
print(f"len of existing labware = {len(INNER_WELL_GEOMETRY_TEST_PARAMS)}")
existing_names = [l[0] for l in INNER_WELL_GEOMETRY_TEST_PARAMS]
diff = set(labware_to_test).difference(set(existing_names))
print("\nlabware missing:")
for missing in diff:
    print(missing)

gotta_add = [
    "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap",
    "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical-15mL-ONLY",
    "opentrons_24_tuberack_generic_2ml_screwcap",
    "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical-50mL-ONLY",
    "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical-50mL-ONLY",
    "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical-15mL-ONLY",
    "usascientific_96_wellplate_2.4ml_deep"
]
failing = [
    "corning_384_wellplate_112ul_flat",
    "agilent_1_reservoir_290ml",
    "usascientific_12_reservoir_22ml",
    "nest_1_reservoir_195ml",
    "opentrons_24_tuberack_nest_2ml_snapcap",
    "nest_1_reservoir_290ml",
]