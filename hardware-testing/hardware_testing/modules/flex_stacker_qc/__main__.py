"""FLEX Stacker QC."""
from os import environ

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"

import argparse
import asyncio
from pathlib import Path
from typing import cast
from dataclasses import asdict

from hardware_testing.data import ui

from opentrons.hardware_control.types import EstopState
from opentrons.drivers.flex_stacker.types import HardwareRevision
from opentrons.hardware_control.modules import (
    ModuleType,
    FlexStacker,
    PlatformState,
    SimulatingModuleAtPort,
)

from .config import TestSection, TestConfig, build_report, TESTS

from hardware_testing.opentrons_api import helpers_ot3


SIM_SERIAL = "dummy_stacker_serial"


def verify_estop_disengaged(api: helpers_ot3.OT3API) -> bool:
    """Verify ESTOP is connected and disengaged."""
    estop_state = api.get_estop_state()
    match estop_state:
        case EstopState.DISENGAGED:
            return True
        case EstopState.NOT_PRESENT:
            ui.print_error("ESTOP is not present, cannot start tests")
            return False
        case _:
            ui.print_error("ESTOP is pressed, please release it before starting")
            ui.get_user_ready("Release ESTOP")
            if api.get_estop_state() is EstopState.DISENGAGED:
                return True
            ui.print_error("ESTOP is still pressed, cannot start tests")
            return False


async def verify_platform_removed(stacker: FlexStacker) -> bool:
    """Verify platform is removed from the carrier."""
    await stacker._reader.read()
    if stacker.platform_state is not PlatformState.UNKNOWN:
        ui.print_error("Platform must be removed from the carrier before starting")
        ui.get_user_ready("Remove platform from {platform_state.value}")
        await stacker._reader.read()
        if stacker.platform_state is not PlatformState.UNKNOWN:
            ui.print_error("Platform is still detected, cannot start tests")
            return False
    return True


async def _build_api(cfg: TestConfig) -> helpers_ot3.OT3API:
    """Build the hardware controller API."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate, gripper="GRPV1120230323A01"
    )
    if cfg.simulate:
        # build a simulator for the FLEX Stacker
        sim_mod = SimulatingModuleAtPort(
            serial_number=SIM_SERIAL,
            model="flexStackerModuleV1",
            port="sim-port",
            name="flexstacker",
        )
        await api._backend.module_controls.register_modules([sim_mod])
    return api


def _get_test_device(api: helpers_ot3.OT3API, barcode: str) -> FlexStacker:
    """Find the FLEX Stacker controller by barcode."""
    found = api._backend.module_controls.get_module_by_module_id(barcode)
    if found and found.MODULE_TYPE == ModuleType.FLEX_STACKER:
        return cast(FlexStacker, found)
    ui.print_error(f"cannot find FLEX Stacker with barcode: {barcode}, aborting")
    raise SystemExit()


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())

    report = build_report(test_name)
    report.set_operator(
        "simulating" if cfg.simulate else input("enter OPERATOR name: ")
    )
    barcode = SIM_SERIAL if cfg.simulate else input("SCAN device barcode: ").strip()
    report.set_tag(barcode)

    # BUILD API
    api = await _build_api(cfg)
    stacker = _get_test_device(api, barcode)
    report.set_device_id(stacker.device_info["serial"], barcode)

    if not cfg.simulate:
        # Perform initial checks before starting tests
        # 1. estop should not be pressed
        # 2. platform should be removed
        assert verify_estop_disengaged(api)
        assert await verify_platform_removed(stacker)

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        ui.print_title(section.value)
        await test_run(stacker, report, section.value, **asdict(cfg))

    # SAVE REPORT
    ui.print_title("DONE")
    report.save_to_disk()
    report.print_results()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--revision", choices=["dvt", "evt", "nff"], default="dvt")
    rev_map = {
        "dvt": HardwareRevision.DVT,
        "evt": HardwareRevision.EVT,
        "nff": HardwareRevision.NFF,
    }
    parser.add_argument("--simulate", action="store_true")
    # add each test-section as a skippable argument (eg: --skip-connectivity)
    for s in TestSection:
        parser.add_argument(f"--skip-{s.value.lower()}", action="store_true")
        parser.add_argument(f"--only-{s.value.lower()}", action="store_true")
    args = parser.parse_args()
    _t_sections = {s: f for s, f in TESTS if getattr(args, f"only_{s.value.lower()}")}
    if _t_sections:
        assert (
            len(list(_t_sections.keys())) < 2
        ), 'use "--only" for just one test, not multiple tests'
    else:
        _t_sections = {
            s: f for s, f in TESTS if not getattr(args, f"skip_{s.value.lower()}")
        }
    _config = TestConfig(
        revision=rev_map[args.revision], simulate=args.simulate, tests=_t_sections
    )
    asyncio.run(_main(_config))
