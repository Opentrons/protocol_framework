import operator
from collections import defaultdict
from functools import reduce
from pathlib import Path
from typing import Any, Dict, List

from citools.generate_analyses import generate_analyses_from_test
from rich.console import Console
from rich.table import Table

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

# ---- END CONFIGURATION VARIABLES ----


def main() -> None:  # noqa: C901
    # Ensure the destination directory exists
    DESTINATION.mkdir(parents=True, exist_ok=True)

    # Generate all configurations reproducibly (from gen_lc)
    all_configs: List[LiquidClassConfig] = generate_all_configs(THEORETICAL_COMBINATIONS)

    # Read the template file
    with open(TEMPLATE_PATH, "r") as f:
        template: str = f.read()

    # Define a marker in the template where we want to inject our generated code
    marker: str = "########## GENERATED LIQUID CLASS ##########"

    # For each configuration, generate a new protocol file.
    for idx, config in enumerate(all_configs):
        # Create an insertion block that includes the generated code mapping.
        insertion: str = marker + "\n"
        insertion += config.to_code("pipette_1000") + "\n"

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

    # Check for errors in the analyses and aggregate them by deepest error type

    protocols_with_errors = []
    error_aggregation = defaultdict(list)

    def get_deepest_error(error: Dict[str, Any]) -> Dict[str, Any]:
        if error.get("wrappedErrors", []):
            return get_deepest_error(error["wrappedErrors"][0])
        return error

    for protocol in analyzed_protocols:
        if protocol.analysis and protocol.analysis.get("errors"):
            protocols_with_errors.append(protocol)

            # Process each error in the protocol
            for error in protocol.analysis["errors"]:
                deepest_error = get_deepest_error(error)
                error_type = deepest_error.get("errorType", "UnknownError")
                error_detail = deepest_error.get("detail", "No details available")
                error_aggregation[error_type].append((protocol, error_detail))

    # Create a rich table for reporting
    console = Console()

    if protocols_with_errors:
        error_table = Table(title=f"Error Summary ({len(protocols_with_errors)} protocols with errors)")
        error_table.add_column("Error Type", style="cyan")
        error_table.add_column("Count", style="magenta")
        error_table.add_column("Example Detail", style="green")

        for error_type, occurrences in sorted(error_aggregation.items(), key=lambda x: len(x[1]), reverse=True):
            # Include only first example to keep the table manageable
            example_detail = occurrences[0][1]
            if len(example_detail) > 80:
                example_detail = example_detail[:77] + "..."
            error_table.add_row(error_type, str(len(occurrences)), example_detail)

        console.print(error_table)

        # Detailed error list as a table
        console.print("\n[bold]Detailed Error List:[/bold]")
        for error_type, occurrences in sorted(error_aggregation.items(), key=lambda x: len(x[1]), reverse=True):
            detail_table = Table(title=f"{error_type} ({len(occurrences)} occurrences)", show_header=True)
            detail_table.add_column("Index", style="dim", width=5)
            detail_table.add_column("Protocol", style="yellow")
            detail_table.add_column("Error Detail", style="green")

            for i, (protocol, detail) in enumerate(occurrences[:5]):  # Limit to first 5 examples
                # Extract just the filename without path
                filename = Path(protocol.host_protocol_file).name
                detail_table.add_row(str(i + 1), filename, detail)

            if len(occurrences) > 5:
                detail_table.add_row("...", "...", f"... and {len(occurrences) - 5} more")

            console.print(detail_table)

    # Report results with rich
    console.print("\n[bold]Analysis Results:[/bold]")
    console.print(f"- Total protocols analyzed: {len(analyzed_protocols)}")
    if protocols_with_errors:
        console.print(f"- [red]Found {len(protocols_with_errors)} protocols with errors[/red]")
    else:
        console.print("- [green]No errors found in any protocol.[/green]")


if __name__ == "__main__":
    main()
