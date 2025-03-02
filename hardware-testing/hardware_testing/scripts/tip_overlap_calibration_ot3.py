"""Tip Overlap Calibration OT3."""
import argparse
import asyncio
from dataclasses import dataclass, asdict
from enum import Enum
from json import load as json_load
from pathlib import Path
from time import sleep
from typing import Dict, Optional, Tuple, List, Any

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import SLOT_CENTER

from opentrons_shared_data.load import get_shared_data_root
from opentrons_shared_data.deck import (
    Z_PREP_OFFSET,
    get_calibration_square_position_in_slot,
)

from hardware_testing.data import ui, create_file_name, create_run_id
from hardware_testing.opentrons_api import helpers_ot3, types
from hardware_testing.drivers import list_ports_and_select
from hardware_testing.drivers.mitutoyo_digimatic_indicator import (
    Mitutoyo_Digimatic_Indicator,
)

CSV_DIVIDER = ","

# make sure the numbers aren't changing when we read from it
DIAL_SETTLING_SECONDS = 2.0

# hardcoded distances for when pressure-probing the calibration square
PROBE_DISTANCE_MM = 10.0
PROBE_OVERSHOOT_MM = 2.0
EXPECTED_PROBE_HEIGHT_MM = 0.0  # the calibration square


def _dataclass_to_csv(dc: Any, is_header: bool = False, prepend: str = "") -> str:
    keys_or_values = [
        key if is_header else str(value) for key, value in asdict(dc).items()
    ]
    return CSV_DIVIDER.join(
        [prepend + kv.upper().replace("_", " ") for kv in keys_or_values]
    )


@dataclass
class TestConfig:
    run_id: str
    flex_id: str
    pipette_id: str
    pipette_mount: str
    pipette_channels: int
    pipette_volume: int

    @property
    def csv_header(self) -> str:
        return _dataclass_to_csv(self, is_header=True)

    @property
    def csv_data(self) -> str:
        return _dataclass_to_csv(self)


@dataclass
class TrialConfig:
    lot: str
    volume: int
    filter: bool
    slot: str
    overlap: float
    well: str
    count: int

    @property
    def csv_header(self) -> str:
        return _dataclass_to_csv(self, is_header=True, prepend="TIP")

    @property
    def csv_data(self) -> str:
        return _dataclass_to_csv(self)


@dataclass
class TrialResult:
    dial_nozzle: float
    dial_tip_nominal: float
    tip_z_error: float
    probed_deck_z: float
    overlap_calibrated: float
    dial_tip_calibrated: float
    error_from_calibrated: float
    error_reduction: float

    @property
    def csv_header(self) -> str:
        return _dataclass_to_csv(self, is_header=True)

    @property
    def csv_data(self) -> str:
        return _dataclass_to_csv(self)


@dataclass
class Trial:
    config: TrialConfig
    result: TrialResult

    @property
    def csv_header(self) -> str:
        return CSV_DIVIDER.join([self.config.csv_header, self.result.csv_header])

    @property
    def csv_data(self) -> str:
        return CSV_DIVIDER.join([self.config.csv_data, self.result.csv_data])


@dataclass
class TestData:
    config: TestConfig
    trials: List[Trial]

    @property
    def csv_header(self) -> str:
        assert len(self.trials)
        return CSV_DIVIDER.join([self.config.csv_header, self.trials[0].csv_header])

    @property
    def csv_data(self) -> str:
        assert len(self.trials)
        return "\n".join(
            [
                CSV_DIVIDER.join([self.config.csv_data, trial.csv_data])
                for trial in self.trials
            ]
        )

    @property
    def csv_data_latest_trial(self) -> str:
        assert len(self.trials)
        return CSV_DIVIDER.join([self.config.csv_data, self.trials[-1].csv_data])


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
    pip_mount: types.OT3Mount,
    tip_slot: int,
    tip_overlap_version: str,
) -> None:
    ui.print_title("TIP-OVERLAP CALIBRATION")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate,
        pipette_left="p1000_single_v3.6",
        pipette_right="p1000_single_v3.6",
    )
    flex_sn = helpers_ot3.get_robot_serial_ot3(api)
    pip_hw = api.hardware_pipettes[pip_mount.to_mount()]
    pip_sn = helpers_ot3.get_pipette_serial_ot3(pip_hw)
    pip_ch = int(pip_hw.channels.value)
    pip_vol = 1000 if "P1K" in pip_sn else 50

    # CSV FILE
    csv_run_id = create_run_id()
    csv_test_name = Path(__file__).name.replace("_", "-").replace(".py", "")
    csv_tag = f"{pip_sn}"
    file_name = create_file_name(csv_test_name, csv_run_id, csv_tag)

    # DIAL-INDICATOR
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

    ui.print_header("JOG to DIAL-INDICATOR")
    await api.retract(pip_mount)
    await helpers_ot3.jog_mount_ot3(api, pip_mount)
    dial_pos = await api.gantry_position(pip_mount)

    async def _test_loop(_tip_ul: float, _tip_well: str) -> None:
        # NOTE: always begin the trial PRESSING the NOZZLE into the dial indicator
        _save_dial_position(DialReading.NOZZLE)
        ui.print_header("measure ERROR from EXPECTED")
        ui.print_info("picking up tip")
        tip_rack_load_name = f"opentrons_flex_96_tiprack_{_tip_ul}ul"
        tip_row_idx = "ABCDEFGH".index(_tip_well[0])
        tip_col_idx = int(_tip_well[1:])
        tip_well_offset = types.Point(x=tip_col_idx * 9.0, y=tip_row_idx * -9.0, z=0)
        tip_a1_pos = helpers_ot3.get_theoretical_a1_position(
            tip_slot, tip_rack_load_name
        )
        tip_pos = tip_a1_pos + tip_well_offset
        tip_length, tip_overlap = get_tip_rack_length_and_overlap(
            api, pip_mount, tip_rack_load_name, tip_overlap_version
        )
        await api.retract(pip_mount)
        await helpers_ot3.move_to_arched_ot3(api, pip_mount, tip_pos)
        await api.pick_up_tip(pip_mount, tip_length=tip_length - tip_overlap)
        await api.retract(pip_mount)
        await helpers_ot3.move_to_arched_ot3(api, pip_mount, dial_pos)
        _save_dial_position(DialReading.TIP)

        ui.print_header("PROBE the CALIBRATION-SQUARE")
        square_pos = types.Point(
            *get_calibration_square_position_in_slot(slot=SLOT_CENTER) + Z_PREP_OFFSET
        )
        await api.retract(pip_mount)
        await api.move_to(pip_mount, square_pos + types.Point(z=PROBE_DISTANCE_MM))
        deck_z = await api.liquid_probe(
            pip_mount, PROBE_DISTANCE_MM + PROBE_OVERSHOOT_MM
        )
        tip_overlap_error_mm = deck_z - EXPECTED_PROBE_HEIGHT_MM
        ui.print_info(
            f"tip is {round(tip_overlap_error_mm, 2)} mm from expected position"
        )
        api.hardware_pipettes[
            pip_mount.to_mount()
        ].current_tip_length += tip_overlap_error_mm

        ui.print_header("measure ERROR from EXPECTED (again)")
        await api.retract(pip_mount)
        await helpers_ot3.move_to_arched_ot3(api, pip_mount, dial_pos)
        _save_dial_position(DialReading.TIP_CORRECTED)
        _append_positions_to_csv()
        _print_csv_contents()
        ui.print_info("returning tip")
        await api.retract(pip_mount)
        await helpers_ot3.move_to_arched_ot3(
            api, pip_mount, tip_pos + types.Point(z=-10)
        )
        await api.drop_tip(pip_mount)

        ui.print_info("returning to the DIAL-INDICATOR for next trial")
        await api.retract(pip_mount)
        await helpers_ot3.move_to_arched_ot3(api, pip_mount, dial_pos)

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
    _parser.add_argument("--tip-overlap-version", type=str, default="v2")
    _args = _parser.parse_args()
    asyncio.run(
        main(
            _args.simulate,
            _mounts[_args.mount],
            _args.tip_slot,
            _args.tip_overlap_version,
        )
    )
