"""Tip Overlap Calibration OT3."""
import argparse
import asyncio
from enum import Enum
from json import load as json_load
from time import sleep
from typing import Dict, Optional, Tuple

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import SLOT_CENTER

from opentrons_shared_data.load import get_shared_data_root
from opentrons_shared_data.deck import (
    Z_PREP_OFFSET,
    get_calibration_square_position_in_slot,
)

from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3, types
from hardware_testing.drivers import list_ports_and_select
from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
    Mitutoyo_Digimatic_Indicator,
)

DIAL_SETTLING_SECONDS = 2.0
PROBE_DISTANCE_MM = 10.0
PROBE_OVERSHOOT_MM = 2.0
EXPECTED_PROBE_HEIGHT_MM = 0.0  # the calibration square


class DialReading(Enum):
    NOZZLE = 0
    TIP = 1
    TIP_CORRECTED = 2


def get_tip_rack_length_and_overlap(
    api: OT3API, mnt: types.OT3Mount, load_name: str, tip_overlap_version: str
) -> Tuple[float, float]:
    labware_def_path = (
        get_shared_data_root() / "labware/definitions/2" / load_name / "1.json"
    )
    with open(labware_def_path, "r") as f:
        labware_def = json_load(f)
    tip_length = labware_def["parameters"]["tipLength"]
    pip = api.hardware_pipettes[mnt.to_mount()]
    tip_overlaps_from_pipette_def = pip.tip_overlap[tip_overlap_version]
    default_overlap = tip_overlaps_from_pipette_def.get(
        "default", labware_def["parameters"]["tipOverlap"]
    )
    tip_overlap = tip_overlaps_from_pipette_def.get(
        f"opentrons/{load_name}/1", default_overlap
    )
    return tip_length, tip_overlap


async def main(
    simulate: bool,
    mnt: types.OT3Mount,
    tip_slot: int,
    tip_size: int,
    tip_overlap_version: str,
) -> None:
    current_dial_readings: Dict[DialReading, Optional[float]] = {
        DialReading.NOZZLE: None,
        DialReading.TIP: None,
        DialReading.TIP_CORRECTED: None,
    }
    dial: Optional[Mitutoyo_Digimatic_Indicator] = None
    if not simulate:
        dial = Mitutoyo_Digimatic_Indicator(
            port=list_ports_and_select("Dial Indicator")
        )
        dial.connect()
        dial.read()

    def _save_dial_position(reading: DialReading) -> None:
        ui.print_info(f"saving {reading.name.upper()} position")
        val = 0.0
        if not simulate:
            sleep(DIAL_SETTLING_SECONDS)
            val = dial.read()
        current_dial_readings[reading] = val

    def _append_positions_to_csv() -> None:
        # TODO: save the dial readings to a CSV file
        return

    def _print_csv_contents() -> None:
        # TODO: just print the entire file
        return

    ui.print_title("TIP-OVERLAP CALIBRATION")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate,
        pipette_left="p1000_single_v3.6",
        pipette_right="p1000_single_v3.6",
    )
    ui.print_header("JOG to DIAL-INDICATOR")
    await api.retract(mnt)
    await helpers_ot3.jog_mount_ot3(api, mnt)
    dial_pos = await api.gantry_position(mnt)

    async def _test_loop() -> None:
        # NOTE: always begin the trial PRESSING the NOZZLE into the dial indicator
        _save_dial_position(DialReading.NOZZLE)
        ui.print_header("measure ERROR from EXPECTED")
        ui.print_info("picking up tip")
        tip_rack_load_name = f"opentrons_flex_96_tiprack_{tip_size}ul"
        tip_pos = helpers_ot3.get_theoretical_a1_position(tip_slot, tip_rack_load_name)
        tip_length, tip_overlap = get_tip_rack_length_and_overlap(
            api, mnt, tip_rack_load_name, tip_overlap_version
        )
        await api.retract(mnt)
        await helpers_ot3.move_to_arched_ot3(api, mnt, tip_pos)
        await api.pick_up_tip(mnt, tip_length=tip_length - tip_overlap)
        await api.retract(mnt)
        await helpers_ot3.move_to_arched_ot3(api, mnt, dial_pos)
        _save_dial_position(DialReading.TIP)

        ui.print_header("PROBE the CALIBRATION-SQUARE")
        square_pos = types.Point(
            *get_calibration_square_position_in_slot(slot=SLOT_CENTER) + Z_PREP_OFFSET
        )
        await api.retract(mnt)
        await api.move_to(mnt, square_pos + types.Point(z=PROBE_DISTANCE_MM))
        deck_z = await api.liquid_probe(mnt, PROBE_DISTANCE_MM + PROBE_OVERSHOOT_MM)
        tip_overlap_error_mm = deck_z - EXPECTED_PROBE_HEIGHT_MM
        ui.print_info(
            f"tip is {round(tip_overlap_error_mm, 2)} mm from expected position"
        )
        api.hardware_pipettes[mnt.to_mount()].current_tip_length += tip_overlap_error_mm

        ui.print_header("measure ERROR from EXPECTED (again)")
        await api.retract(mnt)
        await helpers_ot3.move_to_arched_ot3(api, mnt, dial_pos)
        _save_dial_position(DialReading.TIP_CORRECTED)
        _append_positions_to_csv()
        _print_csv_contents()
        ui.print_info("returning tip")
        await api.retract(mnt)
        await helpers_ot3.move_to_arched_ot3(api, mnt, tip_pos + types.Point(z=-10))
        await api.drop_tip(mnt)

        ui.print_info("returning to the DIAL-INDICATOR for next trial")
        await api.retract(mnt)
        await helpers_ot3.move_to_arched_ot3(api, mnt, dial_pos)

    while True:
        await _test_loop()


if __name__ == "__main__":
    _mounts = {"left": types.OT3Mount.LEFT, "right": types.OT3Mount.RIGHT}
    _parser = argparse.ArgumentParser()
    _parser.add_argument("--simulate", action="store_true")
    _parser.add_argument(
        "--mount", type=str, choices=list(_mounts.keys()), default="left"
    )
    _parser.add_argument("--tip-slot", type=int, default=3)
    _parser.add_argument("--tip-size", type=int, choices=[50, 200, 1000], default=1000)
    _parser.add_argument("--tip-overlap-version", type=str, default="v1")
    _args = _parser.parse_args()
    asyncio.run(
        main(
            _args.simulate,
            _mounts[_args.mount],
            _args.tip_slot,
            _args.tip_size,
            _args.tip_overlap_version,
        )
    )
