"""Protocol engine types for legacy labware offset locations.

This is its own module to fix circular imports.
"""

from typing import Optional

from pydantic import BaseModel, Field

from opentrons.types import DeckSlotName

from .module import ModuleModel


class LegacyLabwareOffsetLocation(BaseModel):
    """Parameters describing when a given offset may apply to a given labware load."""

    slotName: DeckSlotName = Field(
        ...,
        description=(
            "The deck slot where the protocol will load the labware."
            " Or, if the protocol will load the labware on a module,"
            " the deck slot where the protocol will load that module."
            "\n\n"
            # This description should be kept in sync with DeckSlotLocation.slotName.
            'The plain numbers like `"5"` are for the OT-2,'
            ' and the coordinates like `"C2"` are for the Flex.'
            "\n\n"
            "When you provide one of these values, you can use either style."
            " It will automatically be converted to match the robot."
            "\n\n"
            "When one of these values is returned, it will always match the robot."
        ),
    )
    moduleModel: Optional[ModuleModel] = Field(
        None,
        description=(
            "The model of the module that the labware will be loaded onto,"
            " if applicable."
            "\n\n"
            "Because of module compatibility, the model that the protocol requests"
            " may not be exactly the same"
            " as what it will find physically connected during execution."
            " For this labware offset to apply,"
            " this field must be the *requested* model, not the connected one."
            " You can retrieve this from a `loadModule` command's `params.model`"
            " in the protocol's analysis."
        ),
    )
    definitionUri: Optional[str] = Field(
        None,
        description=(
            "The definition URI of a labware that a labware can be loaded onto,"
            " if applicable."
            "\n\n"
            "This can be combined with moduleModel if the labware is loaded on top of"
            " an adapter that is loaded on a module."
        ),
    )
