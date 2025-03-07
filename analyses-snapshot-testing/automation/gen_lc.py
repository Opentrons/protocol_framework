import operator
import random
from dataclasses import dataclass
from functools import reduce

from hypothesis import HealthCheck, settings
from hypothesis import strategies as st
from rich.console import Console
from rich.table import Table


def safe_round(value: float) -> float:
    """
    Round the value to one decimal place, ensuring that -0.0 is converted to 0.0.
    """
    r = round(value, 1)
    return 0.0 if r == 0 else r


@dataclass
class LiquidClassConfig:
    aspirate_mix_enabled: bool = False
    aspirate_pre_wet: bool = False
    aspirate_retract_touch_tip_enabled: bool = False
    aspirate_position_reference: str = "well-top"
    aspirate_offset: tuple[float, float, float] = (0, 0, 0)
    multi_dispense_retract_touch_tip_enabled: bool = False
    multi_dispense_retract_blowout_location: str = "destination"
    multi_dispense_retract_blowout_enabled: bool = True

    def to_code(self, pipette_var: str = "pipette_1000") -> str:
        """
        Generate code mapping for the liquid class configuration.

        This method returns a string that maps the configuration properties
        to the corresponding attributes of the liquid class in the protocol code.

        Args:
            pipette_var (str): The variable name of the pipette instance to reference for flow rate.

        Returns:
            str: A string containing the code mapping for the liquid class configuration.
        """
        code_lines = []
        code_lines.append(f"    liquid_class_config.aspirate.mix.enabled = {self.aspirate_mix_enabled}")
        code_lines.append(f"    liquid_class_config.aspirate.pre_wet = {self.aspirate_pre_wet}")
        code_lines.append(f"    liquid_class_config.aspirate.retract.touch_tip.enabled = {self.aspirate_retract_touch_tip_enabled}")
        code_lines.append(f'    liquid_class_config.aspirate.position_reference = "{self.aspirate_position_reference}"')
        code_lines.append(f"    liquid_class_config.aspirate.offset = {self.aspirate_offset}")
        code_lines.append(
            f"    liquid_class_config.multi_dispense.retract.touch_tip.enabled = {self.multi_dispense_retract_touch_tip_enabled}"
        )
        code_lines.append(
            f'    liquid_class_config.multi_dispense.retract.blowout.location = "{self.multi_dispense_retract_blowout_location}"'
        )
        code_lines.append(f"    liquid_class_config.multi_dispense.retract.blowout.flow_rate = {pipette_var}.flow_rate.blow_out")
        code_lines.append(f"    liquid_class_config.multi_dispense.retract.blowout.enabled = {self.multi_dispense_retract_blowout_enabled}")
        return "\n".join(code_lines)


@st.composite
def liquid_class_config_strategy(draw) -> LiquidClassConfig:  # type: ignore
    # Draw the position reference once and use it for both fields
    position_ref = draw(st.sampled_from(["well-top", "well-bottom"]))

    # Draw other configuration fields
    mix_enabled = draw(st.booleans())
    pre_wet = draw(st.booleans())
    touch_tip = draw(st.booleans())

    # For the offset, draw x and y as usual
    offset_x = draw(st.floats(min_value=-5, max_value=5))
    offset_y = draw(st.floats(min_value=-5, max_value=5))
    # Determine z's minimum value based on the drawn position_ref
    min_z = 0 if position_ref == "well-bottom" else -5
    offset_z = draw(st.floats(min_value=min_z, max_value=5))

    multi_touch_tip = draw(st.booleans())
    blowout_location = draw(st.sampled_from(["destination", "source"]))
    blowout_enabled = draw(st.booleans())

    return LiquidClassConfig(
        aspirate_mix_enabled=mix_enabled,
        aspirate_pre_wet=pre_wet,
        aspirate_retract_touch_tip_enabled=touch_tip,
        aspirate_position_reference=position_ref,
        aspirate_offset=(safe_round(offset_x), safe_round(offset_y), safe_round(offset_z)),
        multi_dispense_retract_touch_tip_enabled=multi_touch_tip,
        multi_dispense_retract_blowout_location=blowout_location,
        multi_dispense_retract_blowout_enabled=blowout_enabled,
    )


# Composite strategy to generate a list of configurations.
@st.composite
def config_list(draw, count: int) -> list[LiquidClassConfig]:  # type: ignore
    return [draw(liquid_class_config_strategy()) for _ in range(count)]


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
