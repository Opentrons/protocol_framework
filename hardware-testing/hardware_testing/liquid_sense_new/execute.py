"""Logic for running a single liquid probe test."""
import csv
import time
from enum import Enum
from typing import Dict, Any, List, Tuple, Optional
from .report import store_tip_results, store_trial, store_baseline_trial
from .run_args import RunArgs
from hardware_testing.gravimetric.workarounds import get_sync_hw_api
from hardware_testing.gravimetric.helpers import (
    _jog_to_find_liquid_height,
)
from hardware_testing.gravimetric.tips import get_unused_tips
from hardware_testing.data import ui, get_testing_data_directory
from opentrons.hardware_control.types import (
    InstrumentProbeType,
    OT3Mount,
    Axis,
    top_types,
    PipetteSensorResponseQueue,
)

from opentrons.protocol_api._types import OffDeckType

from opentrons.protocol_api import ProtocolContext, Well, Labware

from opentrons_shared_data.errors.exceptions import PipetteLiquidNotFoundError


class LLDResult(Enum):
    """Result Strings."""

    success = "success"
    not_found = "not found"
    blockage = "blockage"


def _load_tipracks(
    ctx: ProtocolContext, pipette_channels: int, protocol_cfg: Any, tip: int
) -> List[Labware]:
    # TODO add logic here for partial tip using 96
    use_adapters: bool = pipette_channels == 96
    tiprack_load_settings: List[Tuple[int, str]] = [
        (
            slot,
            f"opentrons_flex_96_tiprack_{tip}ul",
        )
        for slot in protocol_cfg.SLOTS_TIPRACK[tip]  # type: ignore[attr-defined]
    ]
    for ls in tiprack_load_settings:
        ui.print_info(f'Loading tiprack "{ls[1]}" in slot #{ls[0]}')

    adapter: Optional[str] = (
        "opentrons_flex_96_tiprack_adapter" if use_adapters else None
    )
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = ctx.loaded_labwares
    ui.print_info(f"Loaded labwares {loaded_labwares}")
    pre_loaded_tips: List[Labware] = []
    for ls in tiprack_load_settings:
        if ls[0] in loaded_labwares.keys():
            if loaded_labwares[ls[0]].name == ls[1]:
                pre_loaded_tips.append(loaded_labwares[ls[0]])
            else:
                # If something is in the slot that's not what we want, remove it
                # we use this only for the 96 channel
                ui.print_info(
                    f"Removing {loaded_labwares[ls[0]].name} from slot {ls[0]}"
                )
                ctx._core.move_labware(
                    loaded_labwares[ls[0]]._core,
                    new_location=OffDeckType.OFF_DECK,
                    use_gripper=False,
                    pause_for_manual_move=False,
                    pick_up_offset=None,
                    drop_offset=None,
                )
    if len(pre_loaded_tips) == len(tiprack_load_settings):
        return pre_loaded_tips

    tipracks: List[Labware] = []
    for ls in tiprack_load_settings:
        if ctx.deck[ls[0]] is not None:
            tipracks.append(
                ctx.deck[ls[0]].load_labware(ls[1])  # type: ignore[union-attr]
            )
        else:
            tipracks.append(ctx.load_labware(ls[1], location=ls[0], adapter=adapter))
    return tipracks


def _load_dial_indicator(run_args: RunArgs) -> Labware:
    slot_dial = run_args.protocol_cfg.SLOT_DIAL  # type: ignore[union-attr]
    dial_labware_name = "dial_indicator"
    loaded_labwares = run_args.ctx.loaded_labwares
    if (
        slot_dial in loaded_labwares.keys()
        and loaded_labwares[slot_dial].name == dial_labware_name
    ):
        return loaded_labwares[slot_dial]

    dial_labware = run_args.ctx.load_labware(
        dial_labware_name, location=slot_dial, namespace="custom_beta"
    )
    return dial_labware


def _load_test_well(run_args: RunArgs) -> Labware:
    slot_scale = run_args.protocol_cfg.SLOT_SCALE  # type: ignore[union-attr]
    labware_on_scale = run_args.protocol_cfg.LABWARE_ON_SCALE  # type: ignore[union-attr]
    ui.print_info(f'Loading labware on scale: "{labware_on_scale}"')
    if labware_on_scale == "radwag_pipette_calibration_vial":
        namespace = "custom_beta"
    else:
        namespace = "opentrons"
    # If running multiple tests in one run, the labware may already be loaded
    loaded_labwares = run_args.ctx.loaded_labwares
    if (
        slot_scale in loaded_labwares.keys()
        and loaded_labwares[slot_scale].name == labware_on_scale
    ):
        return loaded_labwares[slot_scale]

    labware_on_scale = run_args.ctx.load_labware(
        labware_on_scale, location=slot_scale, namespace=namespace
    )
    return labware_on_scale


# flake8: noqa: C901
def run(
    tip: int,
    run_args: RunArgs,
    starting_tip: str = "A1",
) -> None:
    """Run a liquid probe test."""
    test_labware: Labware = _load_test_well(run_args)
    dial_indicator: Labware = _load_dial_indicator(run_args)
    dial_well: Well = dial_indicator["A1"]
    liquid_height: float = 0.0
    liquid_height_from_deck: float = 0.0
    tip_offset: float = 0.0
    hw_api = get_sync_hw_api(run_args.ctx)
    test_well: Well = test_labware[run_args.test_well]
    _load_tipracks(run_args.ctx, run_args.pipette_channels, run_args.protocol_cfg, tip)
    tips: List[Well] = get_unused_tips(
        ctx=run_args.ctx, tip_volume=tip, pipette_mount=""
    )
    row = "ABCDEFGH".index(starting_tip[0])
    column = int(starting_tip[1:]) - 1
    num_of_tips_to_skip = (column * 8) + row
    del tips[:num_of_tips_to_skip]
    assert len(tips) >= run_args.trials
    results: List[float] = []
    adjusted_results: List[float] = []

    dial_target = dial_well.top()
    if run_args.dial_front_channel:
        y_offset = 0 if run_args.pipette_channels == 1 else 9 * 7
        x_offset = 0 if run_args.pipette_channels != 96 else 9 * -11
        dial_target = dial_target.move(top_types.Point(y=y_offset, x=x_offset))

    def read_dial() -> float:
        time.sleep(2)
        dial_value = run_args.dial_indicator.read()  # type: ignore[union-attr]
        return dial_value

    lpc_offset = 0.0
    if run_args.dial_indicator is not None:
        run_args.pipette.move_to(dial_target)
        lpc_offset = read_dial()
        run_args.pipette._retract()

    def _get_tip_offset() -> float:
        tip_offset = 0.0
        if run_args.dial_indicator is not None:
            run_args.pipette.move_to(dial_target)
            tip_offset = read_dial()
            run_args.pipette._retract()
        return tip_offset

    def _get_target_height() -> None:
        nonlocal liquid_height, liquid_height_from_deck, tip_offset
        run_args.pipette.pick_up_tip(tips[0])
        if run_args.pipette_channels < 96:
            del tips[: run_args.pipette_channels]
        tip_offset = _get_tip_offset()
        liquid_height = _jog_to_find_liquid_height(
            run_args.ctx, run_args.pipette, test_well
        )
        liquid_height_from_deck = test_well.bottom(liquid_height).point.z
        run_args.pipette._retract()

    _get_target_height()

    if run_args.return_tip:
        run_args.pipette.return_tip()
    else:
        run_args.pipette.drop_tip()
        run_args.pipette._retract()

    store_baseline_trial(
        run_args.test_report,
        tip,
        liquid_height_from_deck,
        test_well.top().point.z - liquid_height_from_deck,
        tip_offset - lpc_offset,
    )

    trials_before_jog = run_args.trials_before_jog

    try:
        for trial in range(run_args.trials):
            if trial > 0 and trial % trials_before_jog == 0:
                _get_target_height()
                if run_args.return_tip:
                    run_args.pipette.return_tip()
                else:
                    run_args.pipette.drop_tip()
                    run_args.pipette._retract()

            ui.print_info(f"Picking up {tip}ul tip")
            if run_args.pipette_channels == 96:
                run_args.pipette._retract()
                input("install new tips, press ENTER when ready: ")
            run_args.pipette.pick_up_tip(tips[0])
            if run_args.pipette_channels < 96:
                del tips[: run_args.pipette_channels]
            tip_length_offset = 0.0
            if run_args.dial_indicator is not None:
                run_args.pipette._retract()
                run_args.pipette.move_to(dial_target)
                tip_length_offset = tip_offset - read_dial()
                run_args.pipette._retract()
                ui.print_info(f"Tip Offset  {tip_length_offset}")
            run_args.pipette.move_to(test_well.top(z=2))
            if run_args.wet:
                run_args.pipette.move_to(test_well.bottom(1))
                run_args.pipette.move_to(test_well.top(z=2))
            start_pos = hw_api.current_position_ot3(OT3Mount.LEFT)
            height, result = _run_trial(run_args, tip, trial, start_pos)
            end_pos = hw_api.current_position_ot3(OT3Mount.LEFT)
            ui.print_info("Dropping tip")
            if run_args.return_tip:
                run_args.pipette.return_tip()
            else:
                run_args.pipette.drop_tip()
                run_args.pipette._retract()
            results.append(height)
            adjusted_results.append(height + tip_length_offset)
            hw_pipette = hw_api.hardware_pipettes[top_types.Mount.LEFT]
            plunger_start = hw_pipette.plunger_positions.top
            store_trial(
                run_args.test_report,
                trial,
                tip,
                height,
                end_pos[Axis.P_L],
                start_pos[Axis.Z_L] - height,
                plunger_start - end_pos[Axis.P_L],
                tip_length_offset,
                liquid_height_from_deck,
                result.value,
            )
            ui.print_info(
                f"\n\n Z axis start pos {start_pos[Axis.Z_L]} end pos {end_pos[Axis.Z_L]}"
            )
            ui.print_info(
                f"plunger start pos {plunger_start} end pos {end_pos[Axis.P_L]}\n\n"
            )
    finally:
        ui.print_info(f"RESULTS: \n{results}")
        ui.print_info(f"Adjusted RESULTS: \n{adjusted_results}")
        store_tip_results(run_args.test_report, tip, results, adjusted_results)


def get_plunger_travel(run_args: RunArgs) -> float:
    """Get the travel distance for the pipette."""
    hw_mount = OT3Mount.LEFT if run_args.pipette.mount == "left" else OT3Mount.RIGHT
    hw_api = get_sync_hw_api(run_args.ctx)
    plunger_positions = hw_api._pipette_handler.get_pipette(hw_mount).plunger_positions
    plunger_travel = plunger_positions.bottom - plunger_positions.top
    return plunger_travel


def _test_for_blockage(datafile: str, threshold: float) -> bool:
    with open(datafile, "r") as file:
        reader = csv.reader(file)
        reader_list = list(reader)
        for i in range(1, len(reader_list)):
            if i > 1 and abs(float(reader_list[i][1])) > threshold:
                return abs(float(reader_list[i][1]) - float(reader_list[i - 1][1])) > 40
    return False


def _run_trial(
    run_args: RunArgs,
    tip: int,
    trial: int,
    start_pos: Dict[Axis, float],
) -> Tuple[float, LLDResult]:
    hw_api = get_sync_hw_api(run_args.ctx)
    data_dir = get_testing_data_directory()
    probes: List[InstrumentProbeType] = [InstrumentProbeType.PRIMARY]
    probe_target: InstrumentProbeType = InstrumentProbeType.PRIMARY
    if run_args.pipette_channels > 1:
        probes.append(InstrumentProbeType.SECONDARY)
        probe_target = InstrumentProbeType.BOTH
    data_files: Dict[InstrumentProbeType, str] = {}
    data_capture: PipetteSensorResponseQueue = PipetteSensorResponseQueue()
    for probe in probes:
        data_filename = f"pressure_sensor_data-trial{trial}-tip{tip}-{probe.name}.csv"
        data_file = f"{data_dir}/{run_args.name}/{run_args.run_id}/{data_filename}"
        ui.print_info(f"logging pressure data to {data_file}")
        data_files[probe] = data_file

    start_height = start_pos[Axis.Z_L]
    height = 2 * start_height

    hw_mount = OT3Mount.LEFT if run_args.pipette.mount == "left" else OT3Mount.RIGHT
    try:
        height = hw_api.liquid_probe(
            hw_mount, max_z_dist=20, probe_settings=None, probe=probe_target, response_queue=data_capture
        )
        result: LLDResult = LLDResult.success
    except PipetteLiquidNotFoundError as lnf:
        ui.print_info(f"Liquid not found current position {lnf.detail}")
        result = LLDResult.not_found
    ui.print_info(f"Trial {trial} complete")
    return height, result
