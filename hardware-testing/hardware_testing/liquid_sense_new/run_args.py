"""Run Args."""

import argparse
from dataclasses import dataclass
from json import load as json_load
from pathlib import Path
from typing import List, Any, Optional

from opentrons.protocol_api import InstrumentContext, ProtocolContext
from opentrons.protocol_engine.types import LabwareOffset

from hardware_testing.gravimetric import helpers, workarounds
from hardware_testing.data.csv_report import CSVReport
from hardware_testing.drivers import (
    mitutoyo_digimatic_indicator,
    list_ports_and_select,
)
from hardware_testing.data import (
    ui,
    create_run_id_and_start_time,
    get_git_description,
)

from .report import build_ls_report, store_config, store_serial_numbers
from .config import API_LEVEL, LIQUID_SENSE_CFG, PIPETTE_MODEL_NAME

LABWARE_OFFSETS: List[LabwareOffset] = []


@dataclass
class RunArgs:
    """Common resources across multiple runs."""

    tip_volumes: List[int]
    run_id: str
    pipette: InstrumentContext
    pipette_tag: str
    git_description: str
    pipette_volume: int
    pipette_channels: int
    name: str
    trials: int
    return_tip: bool
    ctx: ProtocolContext
    protocol_cfg: Any
    test_report: CSVReport
    dial_indicator: Optional[mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator]
    trials_before_jog: int
    test_well: str
    wet: bool
    dial_front_channel: bool

    @classmethod
    def _get_protocol_context(cls, args: argparse.Namespace) -> ProtocolContext:
        if not args.simulate and not args.skip_labware_offsets:
            # getting labware offsets must be done before creating the protocol context
            # because it requires the robot-server to be running
            ui.print_title("SETUP")
            ui.print_info(
                "Starting opentrons-robot-server, so we can http GET labware offsets"
            )
            LABWARE_OFFSETS.extend(workarounds.http_get_all_labware_offsets())
            ui.print_info(f"found {len(LABWARE_OFFSETS)} offsets:")
            for offset in LABWARE_OFFSETS:
                ui.print_info(f"\t{offset.createdAt}:")
                ui.print_info(f"\t\t{offset.definitionUri}")
                ui.print_info(f"\t\t{offset.vector}")
        # gather the custom labware (for simulation)
        custom_defs = {}
        if args.simulate:
            labware_dir = Path(__file__).parent.parent / "labware"
            custom_def_uris = [
                "radwag_pipette_calibration_vial",
                "dial_indicator",
            ]
            for def_uri in custom_def_uris:
                with open(labware_dir / def_uri / "1.json", "r") as f:
                    custom_def = json_load(f)
                custom_defs[def_uri] = custom_def
        _ctx = helpers.get_api_context(
            API_LEVEL,  # type: ignore[attr-defined]
            is_simulating=args.simulate,
            pipette_left=PIPETTE_MODEL_NAME[args.pipette][args.channels],
            extra_labware=custom_defs,
        )
        for offset in LABWARE_OFFSETS:
            engine = _ctx._core._engine_client._transport._engine  # type: ignore[attr-defined]
            engine.state_view._labware_store._add_labware_offset(offset)
        return _ctx

    @classmethod
    def build_run_args(cls, args: argparse.Namespace) -> "RunArgs":
        """Build."""
        _ctx = RunArgs._get_protocol_context(args)
        run_id, start_time = create_run_id_and_start_time()
        git_description = get_git_description()
        protocol_cfg = LIQUID_SENSE_CFG[args.pipette][args.channels]
        name = protocol_cfg.metadata["protocolName"]  # type: ignore[union-attr]
        ui.print_header("LOAD PIPETTE")
        pipette = _ctx.load_instrument(
            f"flex_{args.channels}channel_{args.pipette}", args.mount
        )
        loaded_labwares = _ctx.loaded_labwares
        if 12 in loaded_labwares.keys():
            trash = loaded_labwares[12]
        else:
            trash = _ctx.load_labware("opentrons_1_trash_3200ml_fixed", "A3")
        pipette.trash_container = trash
        pipette_tag = helpers._get_tag_from_pipette(pipette, False, False)

        trials = args.trials
        tip_volumes = [args.tip]

        dial: Optional[mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator] = None
        if not _ctx.is_simulating():
            dial_port = list_ports_and_select("Dial Indicator")
            dial = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(
                port=dial_port
            )
            dial.connect()
        ui.print_info(f"pipette_tag {pipette_tag}")
        report = build_ls_report(name, run_id, trials, tip_volumes)
        report.set_tag(name)
        # go ahead and store the meta data now
        store_serial_numbers(
            report,
            pipette_tag,
            git_description,
        )

        store_config(
            report,
            name,
            args.pipette,
            tip_volumes,
            trials,
            args.liquid,
            protocol_cfg.LABWARE_ON_SCALE,  # type: ignore[union-attr]
        )
        return RunArgs(
            tip_volumes=tip_volumes,
            run_id=run_id,
            pipette=pipette,
            pipette_tag=pipette_tag,
            git_description=git_description,
            pipette_volume=args.pipette,
            pipette_channels=args.channels,
            name=name,
            trials=trials,
            return_tip=args.return_tip,
            ctx=_ctx,
            protocol_cfg=protocol_cfg,
            test_report=report,
            dial_indicator=dial,
            trials_before_jog=args.trials_before_jog,
            test_well=args.test_well,
            wet=args.wet,
            dial_front_channel=args.dial_front_channel,
        )
