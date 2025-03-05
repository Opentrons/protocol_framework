import operator
import random
from dataclasses import dataclass
from functools import reduce

from hypothesis import HealthCheck, settings
from hypothesis import strategies as st
from rich.console import Console
from rich.table import Table


@dataclass
class LiquidClassConfig:
    name: str
    aspirate_mix_enabled: bool = False
    aspirate_pre_wet: bool = False
    aspirate_retract_touch_tip_enabled: bool = False
    aspirate_position_reference: str = "well-top"
    aspirate_offset: tuple[float, float, float] = (0, 0, 0)
    multi_dispense_retract_touch_tip_enabled: bool = False
    multi_dispense_retract_blowout_location: str = "destination"
    multi_dispense_retract_blowout_enabled: bool = True


# Hypothesis strategy for generating LiquidClassConfig instances.
liquid_class_config_strategy = st.builds(
    LiquidClassConfig,
    name=st.text(alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", min_size=1, max_size=20),
    aspirate_mix_enabled=st.booleans(),
    aspirate_pre_wet=st.booleans(),
    aspirate_retract_touch_tip_enabled=st.booleans(),
    aspirate_position_reference=st.sampled_from(["well-top", "well-bottom"]),
    aspirate_offset=st.tuples(
        st.floats(min_value=-5, max_value=5).map(lambda x: round(x, 1)),
        st.floats(min_value=-5, max_value=5).map(lambda x: round(x, 1)),
        st.floats(min_value=-5, max_value=5).map(lambda x: round(x, 1)),
    ),
    multi_dispense_retract_touch_tip_enabled=st.booleans(),
    multi_dispense_retract_blowout_location=st.sampled_from(["destination", "source"]),
    multi_dispense_retract_blowout_enabled=st.booleans(),
)


# Composite strategy to generate a list of configurations.
@st.composite
def config_list(draw, count: int) -> list[LiquidClassConfig]:  # type: ignore
    return [draw(liquid_class_config_strategy) for _ in range(count)]


@settings(database=None, suppress_health_check=[HealthCheck.data_too_large])
def generate_all_configs(theoretical_combinations: int) -> list[LiquidClassConfig]:
    """
    Generate a reproducible list of LiquidClassConfig instances using a composite strategy.

    Using the @settings decorator with database=None ensures reproducibility.
    If you need a specific seed, set the HYPOTHESIS_SEED environment variable.
    """
    return config_list(theoretical_combinations).example()


def print_liquid_configs_table() -> None:
    # Calculate theoretical combinations based on discrete fields:
    discrete_field_cardinalities = {
        "aspirate_mix_enabled": 2,
        "aspirate_pre_wet": 2,
        "aspirate_retract_touch_tip_enabled": 2,
        "aspirate_position_reference": 2,
        "multi_dispense_retract_touch_tip_enabled": 2,
        "multi_dispense_retract_blowout_location": 2,
        "multi_dispense_retract_blowout_enabled": 2,
    }
    theoretical_combinations = reduce(operator.mul, discrete_field_cardinalities.values(), 1)

    # Generate all configurations reproducibly.
    all_configs = generate_all_configs(theoretical_combinations)

    # Randomly select 20 configurations for display.
    num_display = 20
    display_configs = random.sample(all_configs, num_display)

    # Create a rich table to display configurations.
    console = Console()
    table = Table(title=f"{num_display} Random Sample Liquid Class Configurations")

    table.add_column("Name", style="cyan")
    table.add_column("Mix", style="green")
    table.add_column("Pre Wet", style="green")
    table.add_column("Touch Tip", style="green")
    table.add_column("Position Ref", style="yellow")
    table.add_column("Offset", style="blue")
    table.add_column("Multi TT", style="green")
    table.add_column("Blowout Loc", style="magenta")
    table.add_column("Blowout", style="green")

    for config in display_configs:
        table.add_row(
            config.name,
            str(config.aspirate_mix_enabled),
            str(config.aspirate_pre_wet),
            str(config.aspirate_retract_touch_tip_enabled),
            config.aspirate_position_reference,
            str(config.aspirate_offset),
            str(config.multi_dispense_retract_touch_tip_enabled),
            config.multi_dispense_retract_blowout_location,
            str(config.multi_dispense_retract_blowout_enabled),
        )

    console.print(table)
    console.print(f"Theoretical number of discrete combinations: {theoretical_combinations}")


if __name__ == "__main__":
    print_liquid_configs_table()
