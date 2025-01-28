"""EvoSep Tips Protocol for 96ch."""
from opentrons.types import AxisType, Point
from opentrons.protocol_api import (
    DISPENSE_ACTION,
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
)
from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError

metadata = {
    "protocolName": "Evotip Test - 96ch Head Robot API",
    "author": "Boren Lin, Opentrons",
    "description": "Evotips protocol with parameters to for abr testing",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.22",
}
SEC_SOAK = 20
EVOSEP_TEMPORARY_OFFSET = 4.5


def add_parameters(parameters: ParameterContext) -> None:
    """Add Parameters."""
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="Skip probing steps and pauses related to liquid .",
        default=False,
    )
    parameters.add_int(
        variable_name="gripper_repetitions",
        display_name="Gripper Move Repetitions",
        description="Number of times gripper repeats action.",
        default=1,
        minimum=1,
        maximum=10,
    )


def set_pressure_sensor_enabled(protocol: ProtocolContext, enabled: bool) -> None:
    """Enable pressure sensor."""
    hw_api = protocol._core.get_hardware()
    ff = hw_api.hardware_feature_flags
    ff.overpressure_detection_enabled = enabled
    hw_api.hardware_feature_flags = ff
    protocol.comment(
        f"Overpressure detection enabled {ff.overpressure_detection_enabled}"
    )


def find_liquid_height(pipette: InstrumentContext, well_to_probe: Well) -> float:
    """Find liquid height of well."""
    try:
        liquid_height = (
            pipette.measure_liquid_height(well_to_probe)
            - well_to_probe.bottom().point.z
        )
    except PipetteLiquidNotFoundError:
        liquid_height = 0
    return liquid_height


def run(protocol: ProtocolContext) -> None:
    """Protocol."""
    robot_api = protocol.robot
    dry_run = protocol.params.dry_run  # type: ignore[attr-defined]
    gripper_repetitions = protocol.params.gripper_repetitions  # type: ignore[attr-defined]
    # Load Labware
    stacked_deepwell_plate = protocol.load_labware(
        "custom_nest_96_wellplate_2ml_deep", "A3", adapter="evo_flex_96_tiprack_adapter"
    )
    stacked_deepwell_plate_2 = protocol.load_labware(
        "custom_nest_96_wellplate_2ml_deep", "C4"
    )
    evotip_rack = stacked_deepwell_plate.load_labware(
        "opentrons_evo_96_wellplate_300ul"
    )
    evotip = evotip_rack.wells()[0]
    sol_a_plate = protocol.load_labware("nest_1_reservoir_195ml", "C2", "Solvent A")
    sol_a = sol_a_plate.wells()[0]
    sample_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D2", "Samples"
    )
    sample = sample_plate.wells()[0]
    soak_plate = protocol.load_labware("nest_1_reservoir_195ml", "B2", "Propanol")
    tips_200 = protocol.load_labware(
        "opentrons_flex_96_tiprack_200ul",
        "A2",
        "200uL tips",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tips_50 = [
        protocol.load_labware(
            "opentrons_flex_96_tiprack_50ul",
            slot,
            "50uL tips",
            adapter="opentrons_flex_96_tiprack_adapter",
        )
        for slot in ["C3", "B3"]
    ]
    p1k_96 = protocol.load_instrument("flex_96channel_1000")
    # Load Evo tips with 3 layers of liquid
    p1k_96.tip_racks = tips_50
    p1k_96.pick_up_tip()
    p1k_96.flow_rate.aspirate = 20
    p1k_96.flow_rate.dispense = 5
    # Add 15 ul
    p1k_96.aspirate(15 + 2, sol_a.bottom(z=2))
    protocol.delay(seconds=1)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))
    p1k_96.dispense(15, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 39))
    protocol.delay(seconds=1)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 34), speed=0.5)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))
    p1k_96.return_tip()
    p1k_96.pick_up_tip()
    # Add 20 ul
    p1k_96.aspirate(20, sample.bottom(z=1))
    protocol.delay(seconds=1)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))
    p1k_96.dispense(20, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - 29))
    protocol.delay(seconds=1)
    p1k_96.move_to(evotip.top(EVOSEP_TEMPORARY_OFFSET - 24), speed=2)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))
    p1k_96.return_tip()
    # adding 150 uL
    H = 7.5
    D = 2
    p1k_96.tip_racks = [tips_200]
    p1k_96.pick_up_tip()
    p1k_96.flow_rate.aspirate = 200
    p1k_96.flow_rate.dispense = 5
    p1k_96.aspirate(150, sol_a.bottom(z=2))
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET))
    p1k_96.dispense(150, evotip.top(z=EVOSEP_TEMPORARY_OFFSET - H).move(Point(x=D)))
    protocol.delay(seconds=1)
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET - H))
    p1k_96.move_to(evotip.top(z=EVOSEP_TEMPORARY_OFFSET + 5))
    p1k_96.move_to(tips_200.wells()[0].top(z=40))
    p1k_96.return_tip()
    # TODO: have gripper pick up then pause
    if dry_run:
        protocol.pause("Check layers in evo tips")
    # Soak tips Action
    for soak_number in range(gripper_repetitions + 1):
        protocol.move_labware(
            labware=evotip_rack,
            new_location=soak_plate,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 5},
            drop_offset={"x": 0, "y": 0, "z": -6},
        )
        protocol.delay(seconds=SEC_SOAK)
        protocol.move_labware(
            labware=evotip_rack,
            new_location=stacked_deepwell_plate,
            use_gripper=True,
            drop_offset={"x": 0, "y": 0, "z": 2},
        )
        p1k_96.home()
    # End Gripper Action
    def pick_up_evo_tips() -> None:
        """Pick up evo tips."""
        # ------------------------Pick up EvoSep Tips--------------------------------
        # set_pressure_sensor_enabled(protocol, False)
        move_pip_to_bot = robot_api.plunger_coordinates_for_volume(
            "left", 500, DISPENSE_ACTION
        )
        robot_api.move_axes_to(axis_map=move_pip_to_bot, speed=15)
        p1k_96.move_to(evotip.top(3.5))
        prep_distance = 8.25
        press_distance = 3.5
        ejector_push_mm = 7.0
        retract_distance = -1 * (prep_distance + press_distance)
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: -6}, speed=10)
        # Drive Q down 3mm at fast speed - look into the pick up tip fuinction to find slow and fast: 10.0
        robot_api.move_axes_relative(axis_map={AxisType.Q: prep_distance}, speed=10.0)
        # 2.8mm at slow speed - cam action pickup speed: 5.5
        robot_api.move_axes_relative(axis_map={AxisType.Q: press_distance}, speed=5.5)
        # retract cam : 11.05
        robot_api.move_axes_relative(axis_map={AxisType.Q: retract_distance}, speed=5.5)
        # Lower tip presence
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 2}, speed=10)
        robot_api.move_axes_relative(axis_map={AxisType.Q: ejector_push_mm}, speed=5.5)
        robot_api.move_axes_relative(
            axis_map={AxisType.Q: -1 * ejector_push_mm}, speed=5.5
        )
        # Lift the Pipette slightly before ejecting
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 6}, speed=10)

    ####
    pick_up_evo_tips()

    def push_out_liquid_and_drop() -> None:
        """Push out liquid."""
        # Push out liquid in 100 sec
        for vol in [750, 500, 250, 0]:
            dispense_liquid = robot_api.plunger_coordinates_for_volume(
                "left", vol, DISPENSE_ACTION
            )
            robot_api.move_axes_to(axis_map=dispense_liquid, speed=1.5)
            protocol.delay(seconds=12.5)
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 8.0}, speed=10.0)
        drop_tip_distance = 19.0 + 10.8
        # Eject the Evo Tips
        robot_api.move_axes_relative(
            axis_map={AxisType.Q: drop_tip_distance}, speed=10.0
        )
        robot_api.move_axes_relative(
            axis_map={AxisType.Q: -1.0 * drop_tip_distance}, speed=10.0
        )
        # Retract the pipette
        robot_api.move_axes_relative(axis_map={AxisType.Z_L: 35.0}, speed=10.0)

    push_out_liquid_and_drop()

    def move_evo_tips_and_probe() -> None:
        """Move Evo tips and probe."""
        # Turn on pressure sensor
        # set_pressure_sensor_enabled(protocol, True)
        # Move Evo tips out of the adapter
        protocol.move_labware(evotip_rack, stacked_deepwell_plate_2, use_gripper=True)
        # Probe liquid ejected
        if not dry_run:
            p1k_96.tip_racks = tips_50
            p1k_96.reset_tipracks()
            p1k_96.pick_up_tip()
            find_liquid_height(p1k_96, stacked_deepwell_plate["A1"])
            p1k_96.return_tip()

    if not dry_run:
        move_evo_tips_and_probe()
        # move evotips back to original plate
        protocol.move_labware(evotip_rack, stacked_deepwell_plate, use_gripper=True)
    # Pick up evo sep tips
    pick_up_evo_tips()
    push_out_liquid_and_drop()
    if not dry_run:
        move_evo_tips_and_probe()
