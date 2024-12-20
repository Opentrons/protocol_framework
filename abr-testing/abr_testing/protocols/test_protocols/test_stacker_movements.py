"""Protocol to Test the Unloading and Loading of the Flex Stacker."""
from opentrons.protocol_api import ParameterContext, ProtocolContext, Labware
from opentrons.protocol_api.module_contexts import (
    ThermocyclerContext,
)
from opentrons.drivers.stacker.slas_demo import StackerModule
from typing import List


metadata = {"protocolName": "flex stack test"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}

def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_int(
        variable_name="lids_in_a_stack",
        display_name="Num of Lids in Stack",
        minimum=1,
        maximum=5,
        default=5,
    )

def run(protocol: ProtocolContext):
    stacker = StackerModule('01', '')