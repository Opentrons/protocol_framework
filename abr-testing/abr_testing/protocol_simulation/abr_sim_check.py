"""Check ABR Protocols Simulate Successfully."""
from abr_testing.protocol_simulation import simulation_metrics
import os
import traceback
from pathlib import Path
from typing import Any, Optional


def check_parameters(file) -> Any:
    with open(file, "r") as f:
        lines = f.readlines()

        file_as_str = "".join(lines)
        if "parameters.add_csv_file" in file_as_str:
            params = ""
            while not params:
                params = input(
                    f"Protocol {Path(file).stem} needs a CSV parameter file. Please enter the path (s to skip): "
                )
                if params != "s":
                    if os.path.exists(params):
                        return params
                    else:
                        params = ""
                        print("Invalid file path")
                else:
                    print("Skipping...")
                    return params


def run(file_to_simulate: Path, params: Optional[str]) -> None:
    """Simulate protocol and raise errors."""
    protocol_name = file_to_simulate.stem
    try:
        if params:
            if params.lower() != "s":
                simulation_metrics.main(file_to_simulate, False, parameters=[params])
        else:
            simulation_metrics.main(file_to_simulate, False)
    except Exception:
        print(f"Error in protocol: {protocol_name}")
        traceback.print_exc()


if __name__ == "__main__":
    # Directory to search
    root_dir = "abr_testing/protocols"

    exclude = [
        "__init__.py",
        "helpers.py",
        "shared_vars_and_funcs.py",
    ]
    print("Simulating Protocols")
    # Walk through the root directory and its subdirectories
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".py"):  # If it's a Python file
                if file in exclude:
                    continue
                file_path = Path(os.path.join(root, file))
                print(f"Simulating protocol: {file_path.stem}")
                params = check_parameters(file_path)
                run(file_path, params)
