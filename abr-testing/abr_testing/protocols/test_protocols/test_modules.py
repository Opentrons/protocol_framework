import asyncio
import time
import traceback
import os
from opentrons.hardware_control.scripts import module_control


async def hs_test_1(module, path_to_file):
    duration = int(input("How long to run this test for? (in seconds): "))
    rpm = input("Target RPM (200-3000): ")
    start = time.time()
    while time.time() - start < duration:
        if not await (hs_test_home(module, path_to_file)):
            return
        time.sleep(5)
        if not await (hs_test_set_shake(module, rpm, path_to_file)):
            return
        time.sleep(10)
        if not await (hs_test_set_shake(module, '0', path_to_file)):
            return
        time.sleep(10)

async def input_codes(module, path_to_file):
    await module_control._main(module, path_to_file)

hs_tests = {"Test 1": (hs_test_1, "Repeatedly home heater shaker then set shake speed"),
            "Input GCodes": (input_codes, "Input g codes"),
            }
td_tests = {}

tc_tests = {}

global modules
modules = {
    "heatershaker": hs_tests,
    "tempdeck": td_tests,
    "thermocycler": tc_tests,
}


async def main(module):
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
        test_dir = BASE_DIRECTORY + f'{module}\\test{tests[selected_test]}'
        print(f"{i}, {description}")
        output_file = os.path.join(test_dir, 'results.txt')
        print(f'PATH: {output_file} ')
        await (function(module, output_file))
    except:
        print("Failed to run test")
        traceback.print_exc()


async def hs_test_home(module, path_to_file):
    hs_gcodes = module_control.hs_gcode_shortcuts
    home_gcode = hs_gcodes["home"]
    await (module_control._main(module, [home_gcode, 'done'], path_to_file))


async def hs_test_set_shake(module, rpm, path_to_file):
    hs_gcodes = module_control.hs_gcode_shortcuts
    set_shake_gcode = hs_gcodes["srpm"].format(rpm=rpm)
    await (module_control._main(module, [set_shake_gcode, 'done'], path_to_file))

async def hs_deactivate(module, path_to_file):
    hs_gcodes = module_control.hs_gcode_shortcuts
    deactivate_gcode = hs_gcodes["deactivate"]
    await (module_control._main(module, [deactivate_gcode, 'done'], path_to_file))


if __name__ == "__main__":
    print("Modules:")
    for i, module in enumerate(modules):
        print(f"{i}) {module}")
    module_int = int(input("Please select a module: "))
    module = list(modules.keys())[module_int]
    asyncio.run(main(module))
