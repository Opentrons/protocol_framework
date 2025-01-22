"""Seal evotip resin tip command request, result, and implementation models."""

from __future__ import annotations
from pydantic import Field, BaseModel
from typing import TYPE_CHECKING, Optional, Type, Union
from opentrons.types import MountType
from opentrons.protocol_engine.types import MotorAxis
from typing_extensions import Literal

from opentrons.protocol_engine.errors import UnsupportedLabwareForActionError
from ..resources import ModelUtils, labware_validation
from ..types import PickUpTipWellLocation, TipGeometry
from .pipetting_common import (
    PipetteIdMixin,
)
from .movement_common import (
    DestinationPositionResult,
    StallOrCollisionError,
    move_to_well,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)

if TYPE_CHECKING:
    from ..state.state import StateView
    from ..execution import MovementHandler, TipHandler, GantryMover


EvotipSealPipetteCommandType = Literal["evotipSealPipette"]


class TipPickUpParams(BaseModel):
    prepDistance: float = Field(
        default=8.25, description="The distance to move down to fit the tips on."
    )
    pressDistance: float = Field(
        default=3.5, description="The distance to press on tips."
    )
    ejectorPushmm: float = Field(
        default=7.0,
        description="The distance to back off to ensure that the tip presence sensors are not triggered.",
    )


class EvotipSealPipetteParams(PipetteIdMixin):
    """Payload needed to seal resin tips to a pipette."""

    labwareId: str = Field(..., description="Identifier of labware to use.")
    wellName: str = Field(..., description="Name of well to use in labware.")
    wellLocation: PickUpTipWellLocation = Field(
        default_factory=PickUpTipWellLocation,
        description="Relative well location at which to pick up the tip.",
    )
    tipPickUpParams: Optional[TipPickUpParams] = Field(
        default=None, description="Specific parameters for "
    )


class EvotipSealPipetteResult(DestinationPositionResult):
    """Result data from the execution of a EvotipSealPipette."""

    tipVolume: float = Field(
        0,
        description="Maximum volume of liquid that the picked up tip can hold, in µL.",
        ge=0,
    )

    tipLength: float = Field(
        0,
        description="The length of the tip in mm.",
        ge=0,
    )

    tipDiameter: float = Field(
        0,
        description="The diameter of the tip in mm.",
        ge=0,
    )


_ExecuteReturn = Union[
    SuccessData[EvotipSealPipetteResult],
    DefinedErrorData[StallOrCollisionError],
]


class EvotipSealPipetteImplementation(
    AbstractCommandImpl[EvotipSealPipetteParams, _ExecuteReturn]
):
    """Evotip seal pipette command implementation."""

    def __init__(
        self,
        state_view: StateView,
        tip_handler: TipHandler,
        model_utils: ModelUtils,
        movement: MovementHandler,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._tip_handler = tip_handler
        self._model_utils = model_utils
        self._movement = movement
        self._gantry_mover = gantry_mover

    async def relative_pickup_tip(
        self,
        pipette_id: str,
        tip_geometry: TipGeometry,
        tip_pick_up_params: TipPickUpParams,
        mount: MountType,
        press_fit: bool,
    ) -> None:
        prep_distance = tip_pick_up_params.prepDistance
        press_distance = tip_pick_up_params.pressDistance
        ejector_push_mm = tip_pick_up_params.ejectorPushmm
        retract_distance = -1 * (prep_distance + press_distance)

        mount_axis = MotorAxis.LEFT_Z if mount == MountType.LEFT else MotorAxis.RIGHT_Z

        if press_fit:
            await self._gantry_mover.move_axes(
                axis_map={mount_axis: prep_distance}, speed=10, relative_move=True
            )

            # Drive Q down 3mm at fast speed - look into the pick up tip fuinction to find slow and fast: 10.0
            await self._gantry_mover.move_axes(
                axis_map={mount_axis: press_distance}, speed=10.0, relative_move=True
            )
            # 2.8mm at slow speed - cam action pickup speed: 5.5
            await self._gantry_mover.move_axes(
                axis_map={mount_axis: press_distance}, speed=5.5, relative_move=True
            )
            # retract cam : 11.05
            await self._gantry_mover.move_axes(
                axis_map={mount_axis: retract_distance}, speed=5.5, relative_move=True
            )
        else:
            await self._gantry_mover.move_axes(
                axis_map={mount_axis: -6}, speed=10, relative_move=True
            )

            # Drive Q down 3mm at fast speed - look into the pick up tip fuinction to find slow and fast: 10.0
            await self._gantry_mover.move_axes(
                axis_map={MotorAxis.AXIS_96_CHANNEL_CAM: prep_distance},
                speed=10.0,
                relative_move=True,
            )
            # 2.8mm at slow speed - cam action pickup speed: 5.5
            await self._gantry_mover.move_axes(
                axis_map={MotorAxis.AXIS_96_CHANNEL_CAM: press_distance},
                speed=5.5,
                relative_move=True,
            )
            # retract cam : 11.05
            await self._gantry_mover.move_axes(
                axis_map={MotorAxis.AXIS_96_CHANNEL_CAM: retract_distance},
                speed=5.5,
                relative_move=True,
            )

            # Lower tip presence
            await self._gantry_mover.move_axes(axis_map={mount_axis: 2}, speed=10)
            await self._gantry_mover.move_axes(
                axis_map={MotorAxis.AXIS_96_CHANNEL_CAM: ejector_push_mm},
                speed=5.5,
                relative_move=True,
            )
            await self._gantry_mover.move_axes(
                axis_map={MotorAxis.AXIS_96_CHANNEL_CAM: -1 * ejector_push_mm},
                speed=5.5,
                relative_move=True,
            )
        # cache_tip
        self._tip_handler.cache_tip(pipette_id, tip_geometry)

    async def execute(
        self, params: EvotipSealPipetteParams
    ) -> Union[SuccessData[EvotipSealPipetteResult], _ExecuteReturn]:
        """Move to and pick up a tip using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        labware_definition = self._state_view.labware.get_definition(params.labwareId)
        if not labware_validation.is_evotips(labware_definition.parameters.loadName):
            raise UnsupportedLabwareForActionError(
                f"Cannot use command: `EvotipSealPipette` with labware: {labware_definition.parameters.loadName}"
            )

        well_location = self._state_view.geometry.convert_pick_up_tip_well_location(
            well_location=params.wellLocation
        )
        move_result = await move_to_well(
            movement=self._movement,
            model_utils=self._model_utils,
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        if isinstance(move_result, DefinedErrorData):
            return move_result

        tip_geometry = self._state_view.geometry.get_nominal_tip_geometry(
            pipette_id, labware_id, well_name
        )
        channels = self._state_view.tips.get_pipette_active_channels(pipette_id)
        mount = self._state_view.pipettes.get_mount(pipette_id)
        if params.tipPickUpParams and channels != 96:
            await self.relative_pickup_tip(
                pipette_id, params.tipPickUpParams, mount, press_fit=True
            )
        elif channels == 96:
            pick_up_params = (
                params.tipPickUpParam if params.tipPickUpParams else TipPickUpParams()
            )
            await self.relative_pickup_tip(
                pipette_id, pick_up_params, mount, press_fit=False
            )
        else:
            tip_geometry = await self._tip_handler.pick_up_tip(
                pipette_id=pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                do_not_ignore_tip_presence=False,
            )
        state_update = move_result.state_update.update_pipette_tip_state(
            pipette_id=pipette_id,
            tip_geometry=tip_geometry,
        ).set_fluid_empty(pipette_id=pipette_id)
        return SuccessData(
            public=EvotipSealPipetteResult(
                tipVolume=tip_geometry.volume,
                tipLength=tip_geometry.length,
                tipDiameter=tip_geometry.diameter,
                position=move_result.public.position,
            ),
            state_update=state_update,
        )


class EvotipSealPipette(
    BaseCommand[
        EvotipSealPipetteParams,
        EvotipSealPipetteResult,
        StallOrCollisionError,
    ]
):
    """Seal evotip resin tip command model."""

    commandType: EvotipSealPipetteCommandType = "evotipSealPipette"
    params: EvotipSealPipetteParams
    result: Optional[EvotipSealPipetteResult]

    _ImplementationCls: Type[
        EvotipSealPipetteImplementation
    ] = EvotipSealPipetteImplementation


class EvotipSealPipetteCreate(BaseCommandCreate[EvotipSealPipetteParams]):
    """Seal evotip resin tip command creation request model."""

    commandType: EvotipSealPipetteCommandType = "evotipSealPipette"
    params: EvotipSealPipetteParams

    _CommandCls: Type[EvotipSealPipette] = EvotipSealPipette
