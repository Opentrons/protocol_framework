"""Test Connectivity."""
from typing import List, Union

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from hardware_testing.opentrons_api import helpers_ot3
from opentrons.drivers.flex_stacker.types import HardwareRevision
from opentrons.hardware_control.modules import FlexStacker


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("usb-get-device-info", [str, str, str, CSVResult]),
        CSVLine("eeprom-set-serial-number", [str, str, CSVResult]),
        CSVLine("led-blinking", [bool, CSVResult]),
    ]


async def test_gcode(
    module: FlexStacker, report: CSVReport, revision: HardwareRevision
) -> None:
    """Send and receive response for GCODE M115."""
    success = True
    info = await module._driver.get_device_info()
    if not info:
        ui.print_error("Failed to get device info")
        raise SystemExit()
    elif info.hw != revision:
        ui.print_info(f"Hardware Revision expected {revision}, got {info.hw or None}")
        success = False
    report(
        "CONNECTIVITY",
        "usb-get-device-info",
        [info.fw, info.hw, info.sn, CSVResult.from_bool(success)],
    )


async def test_eeprom(module: FlexStacker, report: CSVReport, simulate: bool) -> None:
    """Set serial number and make sure device info is updated accordingly."""
    success = True
    if not simulate:
        serial = input("enter Serial Number: ")
    else:
        serial = "STACKER-SIMULATOR-SN"
    await module._driver.set_serial_number(serial)
    info = await module._driver.get_device_info()
    if info.sn != serial:
        ui.print_info("Serial number is not set properly")
        success = False
    report(
        "CONNECTIVITY",
        "eeprom-set-serial-number",
        [serial, info.sn, CSVResult.from_bool(success)],
    )


async def test_leds(module: FlexStacker, report: CSVReport, simulate: bool) -> None:
    """Prompt tester to verify the status led is blinking."""
    if not simulate:
        is_blinking = ui.get_user_answer("Is the status LED blinking?")
    else:
        is_blinking = True
    report(
        "CONNECTIVITY", "led-blinking", [is_blinking, CSVResult.from_bool(is_blinking)]
    )


async def run(
    module: FlexStacker,
    report: CSVReport,
    section: str,
    simulate: bool,
    api: helpers_ot3.OT3API,
    hardware_revision: HardwareRevision,
) -> None:
    """Run."""
    ui.print_header("USB Communication")
    await test_gcode(module, report, hardware_revision)

    ui.print_header("EEPROM Communication")
    await test_eeprom(module, report, simulate)

    ui.print_header("LED Blinking")
    await test_leds(module, report, simulate)
