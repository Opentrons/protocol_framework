"""FLEX Stacker EVT QC."""
from os import environ

# NOTE: this is required to get WIFI test to work
if "OT_SYSTEM_VERSION" not in environ:
    environ["OT_SYSTEM_VERSION"] = "0.0.0"

import argparse
import asyncio
from pathlib import Path
from typing import Tuple

from hardware_testing.data import ui
from hardware_testing.data.csv_report import CSVReport

from .config import TestSection, TestConfig, build_report, TESTS
from .driver import FlexStacker


def build_stacker_report(is_simulating: bool) -> Tuple[CSVReport, FlexStacker]:
    """Report setup for FLEX Stacker qc script."""
    test_name = Path(__file__).parent.name.replace("_", "-")
    ui.print_title(test_name.upper())

    stacker = FlexStacker.build_simulator() if is_simulating else FlexStacker.build()

    report = build_report(test_name)
    report.set_operator(
        "simulating" if is_simulating else input("enter OPERATOR name: ")
    )
    info = stacker.get_device_info()
    if not is_simulating:
        barcode = input("SCAN device barcode: ").strip()
    else:
        barcode = "STACKER-SIMULATOR-SN"
    report.set_tag(info.sn)
    report.set_device_id(info.sn, barcode)
    return report, stacker


async def _main(cfg: TestConfig) -> None:
    # BUILD REPORT
    report, stacker = build_stacker_report(cfg.simulate)

    # RUN TESTS
    for section, test_run in cfg.tests.items():
        ui.print_title(section.value)
        test_run(stacker, report, section.value)

    # SAVE REPORT
    ui.print_title("DONE")
    report.save_to_disk()
    report.print_results()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
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
    _config = TestConfig(simulate=args.simulate, tests=_t_sections)
    asyncio.run(_main(_config))
