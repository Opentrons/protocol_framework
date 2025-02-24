"""Liquid sense testing."""
import argparse
import subprocess
import os
from typing import Optional
import traceback

from opentrons_hardware.hardware_control.motion_planning import move_utils

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.data import (
    ui,
    get_testing_data_directory,
)

from .run_args import RunArgs
from .execute import run


if __name__ == "__main__":
    move_utils.MINIMUM_DISPLACEMENT = 0.01

    parser = argparse.ArgumentParser("Pipette Testing")
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[50, 200, 1000], required=True)
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--channels", type=int, choices=[1, 8, 96], default=1)
    parser.add_argument("--tip", type=int, choices=[20, 50, 200, 1000], required=True)
    parser.add_argument("--return-tip", action="store_true")
    parser.add_argument("--trials", type=int, default=10)
    parser.add_argument("--trials-before-jog", type=int, default=10)
    parser.add_argument("--wet", action="store_true")
    parser.add_argument("--starting-tip", type=str, default="A1")
    parser.add_argument("--test-well", type=str, default="A1")
    parser.add_argument("--liquid", type=str, default="unknown")
    parser.add_argument("--skip-labware-offsets", action="store_true")
    parser.add_argument("--dial-front-channel", action="store_true")

    args = parser.parse_args()

    run_args = RunArgs.build_run_args(args)
    exit_error = 0
    serial_logger: Optional[subprocess.Popen] = None
    data_dir = get_testing_data_directory()
    data_file = f"/{data_dir}/{run_args.name}/{run_args.run_id}/serial.log"
    try:
        hw = run_args.ctx._core.get_hardware()
        ui.print_info("homing...")
        run_args.ctx.home()
        for tip in run_args.tip_volumes:
            run(tip, run_args, args.starting_tip)
    except Exception as e:
        ui.print_error(f"got error {e}")
        ui.print_error(traceback.format_exc())
        exit_error = 1
    finally:
        if run_args.dial_indicator is not None:
            run_args.dial_indicator.disconnect()
        run_args.test_report.save_to_disk()
        run_args.test_report.print_results()
        ui.print_info("done\n\n")
        if not run_args.ctx.is_simulating():
            new_folder_name = (
                f"MS{args.z_speed}_PS{args.plunger_speed}_{run_args.run_id}"
            )
        run_args.ctx.cleanup()
        if not args.simulate:
            helpers_ot3.restart_server_ot3()
        os._exit(exit_error)
