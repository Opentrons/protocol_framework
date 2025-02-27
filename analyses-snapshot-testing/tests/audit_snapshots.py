import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

from rich.console import Console
from rich.markup import escape
from rich.panel import Panel
from rich.theme import Theme


@dataclass
class AuditResult:
    files_with_unexpected_errors: List[Path]
    files_missing_expected_errors: List[Path]


def audit_snapshots() -> AuditResult:  # noqa: C901

    theme = Theme({"error": "bold red", "success": "bold green", "info": "bold blue", "path": "yellow"})
    console = Console(theme=theme)

    current_dir = Path(__file__).parent
    snapshot_path = Path(current_dir, "__snapshots__", "analyses_snapshot_test")
    json_files = list(snapshot_path.glob("**/*.json"))

    files_with_unexpected_errors = []
    files_missing_expected_errors = []

    console.print(Panel(f"Found [info]{len(json_files)}[/] JSON files in [path]{snapshot_path}[/]"))

    with console.status("[info]Processing snapshot files...[/]"):
        for file_path in json_files:

            try:
                with open(file_path, "r") as f:
                    data = json.load(f)

                # which is best to check???
                # they both give the same result
                # errors_present = data["errors"] != []
                errors_present = data["result"] != "ok"

                file_path_str = str(file_path)
                if "Flex_S" in file_path_str or "OT2_S" in file_path_str or "pl_" in file_path_str:
                    if errors_present:
                        files_with_unexpected_errors.append(file_path)
                else:
                    if not errors_present:
                        files_missing_expected_errors.append(file_path)

            except json.JSONDecodeError:
                console.print(f"[error]Invalid JSON format in:[/] [path]{file_path}[/]")
                raise
            except Exception as e:
                console.print(f"[error]Error processing[/] [path]{file_path}[/]: {str(e)}")
                raise

    console.print(Panel(f"[error]Files with unexpected errors:[/] {len(files_with_unexpected_errors)}", title="Unexpected Errors"))
    if files_with_unexpected_errors:
        for path in files_with_unexpected_errors:
            relative_path = Path(path).relative_to(snapshot_path)
            console.print(f"  • [path]{escape(str(relative_path))}[/]")

    console.print(Panel(f"[error]Files missing expected errors:[/] {len(files_missing_expected_errors)}", title="Missing Errors"))
    if files_missing_expected_errors:
        for path in files_missing_expected_errors:
            relative_path = Path(path).relative_to(snapshot_path)
            console.print(f"  • [path]{escape(str(relative_path))}[/]")

    result = AuditResult(
        files_with_unexpected_errors=files_with_unexpected_errors, files_missing_expected_errors=files_missing_expected_errors
    )

    # Print summary
    if not files_with_unexpected_errors and not files_missing_expected_errors:
        console.print(Panel("[success]All snapshot tests passed correctly![/]", title="Audit Complete"))
    else:
        console.print(
            Panel(
                f"[error]Found {len(files_with_unexpected_errors) + len(files_missing_expected_errors)} issues[/]", title="Audit Complete"
            )
        )

    return result


if __name__ == "__main__":
    audit_snapshots()
