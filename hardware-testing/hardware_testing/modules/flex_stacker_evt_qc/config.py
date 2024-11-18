"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_connectivity,
    test_z_axis,
    test_l_axis,
)


class TestSection(enum.Enum):
    """Test Section."""

    CONNECTIVITY = "CONNECTIVITY"
    Z_AXIS = "Z_AXIS"
    L_AXIS = "L_AXIS"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.CONNECTIVITY,
        test_connectivity.run,
    ),
    (
        TestSection.Z_AXIS,
        test_z_axis.run,
    ),
    (
        TestSection.L_AXIS,
        test_l_axis.run,
    ),
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.CONNECTIVITY.value,
                lines=test_connectivity.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.Z_AXIS.value,
                lines=test_z_axis.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.L_AXIS.value,
                lines=test_l_axis.build_csv_lines(),
            ),
        ],
    )
