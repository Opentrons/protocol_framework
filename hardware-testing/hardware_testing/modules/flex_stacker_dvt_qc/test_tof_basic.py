"""Test TOF Sensor Comms."""

from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .driver import FlexStackerInterface as FlexStacker
from opentrons.drivers.flex_stacker.types import (
    Direction,
    StackerAxis,
    LEDPattern,
    TOFSensor,
    TOFSensorState,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine(f"tof-X-enabled", [CSVResult]),
        CSVLine(f"tof-X-disabled", [CSVResult]),
        CSVLine(f"tof-Z-enabled", [CSVResult]),
        CSVLine(f"tof-Z-disabled", [CSVResult]),
    ]
    # Add histogram data bins
    for sensor in TOFSensor:
        for zone in range(10):
            lines.append(
                CSVLine(
                    f"tof-{sensor.name}-empty-histogram-zone-{zone}",
                    [CSVResult, str],
                )
            )
    return lines


async def tof_sensors_installed(stacker: FlexStacker) -> bool:
    """Check if the tof sensor are installed."""
    tof_x = await stacker._driver.get_tof_sensor_status(TOFSensor.X)
    tof_z = await stacker._driver.get_tof_sensor_status(TOFSensor.Z)
    return tof_x.ok and tof_z.ok


async def test_tof_sensors_for_comms(
    stacker: FlexStacker,
    sensor: TOFSensor,
    enable: bool,
    report: CSVReport,
    section: str,
) -> None:
    """Test the communication of the tof sensor."""
    ui.print_header(f"TOF Sensor - {sensor} sensor.")

    # disable the opposite sensor so we can test one at a time
    other = TOFSensor.X if sensor == TOFSensor.Z else TOFSensor.Z
    await stacker._driver.enable_tof_sensor(other, False)

    # Set the state of the target sensor
    await stacker._driver.enable_tof_sensor(sensor, enable)
    status = await stacker._driver.get_tof_sensor_status(sensor)
    enabled = "enabled" if enable else "disabled"
    report(
        section,
        f"tof-{sensor.name}-{enabled}",
        [
            CSVResult.from_bool(enable == status.ok),
        ],
    )


async def test_get_tof_sensor_histogram(
    stacker: FlexStacker, report: CSVReport, section: str, sensor: TOFSensor
) -> None:
    """Test that we can request and store histogram measurements from this TOF sensor."""
    if not stacker._simulating:
        # Cancel any on-going measurements and make sure sensor is enabled
        await stacker._driver.manage_tof_measurement(sensor, start=False)
        status = await stacker._driver.get_tof_sensor_status(sensor)
        if not status.ok or status.state != TOFSensorState.MEASURING:
            report(
                section,
                f"tof-{sensor.name}-empty-histogram",
                [
                    CSVResult.FAIL,
                    [],
                ],
            )
            return

    print(f"Getting histogram for {sensor}.")
    histogram = await stacker._driver.get_tof_histogram(sensor)
    for zone, bins in histogram.bins.items():
        report(
            section,
            f"tof-{sensor.name}-empty-histogram-zone-{zone}",
            [
                CSVResult.PASS,
                bins,
            ],
        )


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    # Reset LEDs to off
    if not stacker._simulating:
        ui.get_user_ready("Make sure both TOF sensors are installed.")
        ui.get_user_ready("Make sure there is no labware in the stacker.")
        await stacker._driver.set_led(0, pattern=LEDPattern.STATIC)

    if not stacker._simulating and not await tof_sensors_installed(stacker):
        print("FAILURE - Cannot start tests without tof sensors installed.")
        return

    print("Homing stacker X and Z axis.")
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)

    print("Disabling both TOF sensors.")
    await stacker._driver.enable_tof_sensor(TOFSensor.X, False)
    await stacker._driver.enable_tof_sensor(TOFSensor.Z, False)

    print("Test TOF sensor I2C communication")
    await test_tof_sensors_for_comms(stacker, TOFSensor.X, False, report, section)
    await test_tof_sensors_for_comms(stacker, TOFSensor.Z, False, report, section)
    await test_tof_sensors_for_comms(stacker, TOFSensor.X, True, report, section)
    await test_tof_sensors_for_comms(stacker, TOFSensor.Z, True, report, section)

    print("Test TOF sensor get histogram")
    await test_get_tof_sensor_histogram(stacker, report, section, TOFSensor.X)
    await test_get_tof_sensor_histogram(stacker, report, section, TOFSensor.Z)
