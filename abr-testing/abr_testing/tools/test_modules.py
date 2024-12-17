"""Modules Tests Script!"""
import asyncio
import time
import traceback
import os
import module_control  # type: ignore
from typing import Any, Tuple, Dict

# To run:
# SSH into robot
# cd /opt/opentrons-robot-server/abr-testing/tools
# python3 test_modules.py


async def hs_test_1(module: str, path_to_file: str) -> None:
    """Heater Shaker Test 1."""
    duration = int(input("How long to run this test for? (in seconds): "))
    rpm = input("Target RPM (200-3000): ")
    start = time.time()
    while time.time() - start < duration:
        try:
            await (hs_test_home(module, path_to_file))
        except asyncio.TimeoutError:
            return
        time.sleep(5)
        try:
            await (hs_test_set_shake(module, rpm, path_to_file))
        except asyncio.TimeoutError:
            return
        time.sleep(10)
        try:
            await (hs_test_set_shake(module, "0", path_to_file))
        except asyncio.TimeoutError:
            return
        time.sleep(10)


async def input_codes(module: str, path_to_file: str) -> None:
    """Opens serial for manual code input."""
    await module_control._main(module, path_to_file)


hs_tests: Dict[str, Tuple[Any, str]] = {
    "Test 1": (hs_test_1, "Repeatedly home heater shaker then set shake speed"),
    "Input GCodes": (input_codes, "Input g codes"),
}
td_tests: Dict[str, Tuple[Any, str]] = {}

tc_tests: Dict[str, Tuple[Any, str]] = {}

global modules
modules = {
    "heatershaker": hs_tests,
    "tempdeck": td_tests,
    "thermocycler": tc_tests,
}


async def main(module: str) -> None:
    """Select test to be run."""
    # Select test to run
    # Set directory for tests
    BASE_DIRECTORY = "\\userfs\\data\\testing_data\\"
    if not os.path.exists(BASE_DIRECTORY):
        os.makedirs(BASE_DIRECTORY)
    tests = modules[module]
    for i, test in enumerate(tests.keys()):
        function, description = tests[test]
        print(f"{i}) {test} : {description}")
    selected_test = int(input("Please select a test: "))
    try:
        function, description = tests[list(tests.keys())[selected_test]]
        test_dir = BASE_DIRECTORY + f"{module}\\test{list(tests.keys())[selected_test]}"
        print(f"{i}, {description}")
        output_file = os.path.join(test_dir, "results.txt")
        print(f"PATH: {output_file} ")
        await (function(module, output_file))
    except Exception:
        print("Failed to run test")
        traceback.print_exc()


async def hs_test_home(module: str, path_to_file: str) -> None:
    """Home heater shaker."""
    hs_gcodes = module_control.hs_gcode_shortcuts
    home_gcode = hs_gcodes["home"]
    await (module_control._main(module, [home_gcode, "done"], path_to_file))


async def hs_test_set_shake(module: str, rpm: str, path_to_file: str) -> None:
    """Shake heater shaker at specified speed."""
    hs_gcodes = module_control.hs_gcode_shortcuts
    set_shake_gcode = hs_gcodes["srpm"].format(rpm=rpm)
    await (module_control._main(module, [set_shake_gcode, "done"], path_to_file))


async def hs_deactivate(module: str, path_to_file: str) -> None:
    """Deactivate Heater Shaker."""
    hs_gcodes = module_control.hs_gcode_shortcuts
    deactivate_gcode = hs_gcodes["deactivate"]
    await (module_control._main(module, [deactivate_gcode, "done"], path_to_file))


if __name__ == "__main__":
    print("Modules:")
    for i, module in enumerate(modules):
        print(f"{i}) {module}")
    module_int = int(input("Please select a module: "))
    module = list(modules.keys())[module_int]
    asyncio.run(main(module))
