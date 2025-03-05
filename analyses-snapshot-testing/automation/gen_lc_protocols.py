import operator
from functools import reduce
from pathlib import Path
from typing import Dict, List

from citools.generate_analyses import generate_analyses_from_test

from automation.data.protocol import Protocol
from automation.gen_lc import LiquidClassConfig, generate_all_configs

# ---- CONFIGURATION VARIABLES ----
DESTINATION: Path = Path(Path(__file__).parent.parent, "files", "protocols", "generated_protocols")
TEMPLATE_PATH: Path = Path(Path(__file__).parent, "template.py")

# Calculate theoretical discrete combinations (if you want to generate them all)
discrete_field_cardinalities: Dict[str, int] = {
    "aspirate_mix_enabled": 2,
    "aspirate_pre_wet": 2,
    "aspirate_retract_touch_tip_enabled": 2,
    "aspirate_position_reference": 2,
    "multi_dispense_retract_touch_tip_enabled": 2,
    "multi_dispense_retract_blowout_location": 2,
    "multi_dispense_retract_blowout_enabled": 2,
}
THEORETICAL_COMBINATIONS: int = reduce(operator.mul, discrete_field_cardinalities.values(), 1)

# Optionally, you could choose to generate only a random sample of the configurations
# SAMPLE_SIZE: int = 20

# ---- END CONFIGURATION VARIABLES ----


def main() -> None:
    # Ensure the destination directory exists
    DESTINATION.mkdir(parents=True, exist_ok=True)

    # Generate all configurations reproducibly (from gen_lc)
    all_configs: List[LiquidClassConfig] = generate_all_configs(THEORETICAL_COMBINATIONS)

    # Optionally, if you want to use a sample (uncomment the following two lines):
    # SAMPLE_SIZE = 20
    # all_configs = random.sample(all_configs, SAMPLE_SIZE)

    # Read the template file
    with open(TEMPLATE_PATH, "r") as f:
        template: str = f.read()

    # Define a marker in the template where we want to inject our generated code
    marker: str = "########## GENERATED LIQUID CLASS ##########"

    # For each configuration, generate a new protocol file.
    for idx, config in enumerate(all_configs):
        # Create an insertion block that includes a ctx.comment statement.
        insertion: str = marker + "\n"
        insertion += f'    ctx.comment("Generated LiquidClassConfig: {config}")\n'

        # Replace the marker in the template with our insertion block.
        new_file_content: str = template.replace(marker, insertion)

        # Optionally, modify the metadata protocol name to include the configuration index.
        new_file_content = new_file_content.replace('"P1000 1ch distribute_liquid"', f'"P1000 1ch distribute_liquid - config {idx}"')

        # Define output file path
        output_path: Path = DESTINATION / f"protocol_{idx}.py"
        with open(output_path, "w") as f:
            f.write(new_file_content)

    print(f"Generated {len(all_configs)} protocol files.")

    # Create Protocol objects from the generated files
    protocols_to_analyze: List[Protocol] = []

    for idx, _ in enumerate(all_configs):
        protocols_to_analyze.append(
            Protocol(
                file_stem=f"protocol_{idx}",
                file_extension="py",
                robot="Flex",
                custom_labware=None,
                from_override=True,  # We store these where the generated ones are.
            )
        )

    print(f"Analyzing {len(protocols_to_analyze)} protocols with 'edge' tag...")

    # Generate analyses for all protocols with the "edge" tag
    analyzed_protocols = generate_analyses_from_test("edge", protocols_to_analyze)

    # Check for errors in the analyses
    protocols_with_errors = []
    for protocol in analyzed_protocols:
        if protocol.analysis and protocol.analysis.get("errors"):
            protocols_with_errors.append(protocol)

    # Report results
    print("\nAnalysis Results:")
    print(f"- Total protocols analyzed: {len(analyzed_protocols)}")
    if protocols_with_errors:
        print(f"- Found {len(protocols_with_errors)} protocols with errors:")
        for protocol in protocols_with_errors:
            print(f"  - {protocol.host_protocol_file}")
    else:
        print("- No errors found in any protocol.")


if __name__ == "__main__":
    main()
