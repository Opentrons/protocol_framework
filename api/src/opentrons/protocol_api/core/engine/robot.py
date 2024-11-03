from typing import Optional, Dict, Union
from opentrons.hardware_control import SyncHardwareAPI
from opentrons_shared_data.pipette.pipette_definition import SupportedTipsDefinition

from opentrons.types import Mount, MountType, Point, AxisType, AxisMapType
from opentrons_shared_data.pipette import types as pip_types
from opentrons_shared_data.pipette.ul_per_mm import (
    piecewise_volume_conversion,
    PIPETTING_FUNCTION_FALLBACK_VERSION,
    PIPETTING_FUNCTION_LATEST_VERSION,
)
from opentrons.protocol_api._types import PipetteActionTypes, PlungerPositionTypes
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import DeckPoint, MotorAxis

from opentrons.protocol_api.core.robot import AbstractRobot


_AXIS_TYPE_TO_MOTOR_AXIS = {
    AxisType.X: MotorAxis.X,
    AxisType.Y: MotorAxis.Y,
    AxisType.P_L: MotorAxis.LEFT_PLUNGER,
    AxisType.P_R: MotorAxis.RIGHT_PLUNGER,
    AxisType.Z_L: MotorAxis.LEFT_Z,
    AxisType.Z_R: MotorAxis.RIGHT_Z,
    AxisType.Z_G: MotorAxis.EXTENSION_Z,
    AxisType.G: MotorAxis.EXTENSION_JAW,
    AxisType.Q: MotorAxis.AXIS_96_CHANNEL_CAM,
}


class RobotCore(AbstractRobot):
    """Robot API core using a ProtocolEngine.

    Args:
        engine_client: A client to the ProtocolEngine that is executing the protocol.
        api_version: The Python Protocol API versionat which  this core is operating.
        sync_hardware: A SynchronousAdapter-wrapped Hardware Control API.
    """

    def __init__(
        self, engine_client: EngineClient, sync_hardware_api: SyncHardwareAPI
    ) -> None:
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api

    def _convert_to_engine_mount(self, axis_map: AxisMapType) -> Dict[MotorAxis, float]:
        return {_AXIS_TYPE_TO_MOTOR_AXIS[ax]: dist for ax, dist in axis_map.items()}

    def _ul_per_mm_conversion(
        self,
        pipette_settings: SupportedTipsDefinition,
        ul: float,
        action: PipetteActionTypes,
    ) -> float:
        if action == PipetteActionTypes.ASPIRATE_ACTION:
            fallback = pipette_settings.aspirate.default[
                PIPETTING_FUNCTION_FALLBACK_VERSION
            ]
            sequence = pipette_settings.aspirate.default.get(
                PIPETTING_FUNCTION_LATEST_VERSION, fallback
            )
        elif action == PipetteActionTypes.BLOWOUT_ACTION:
            # TODO in followup work we should support handling blow out actions for volume.
            return 1.0
        else:
            fallback = pipette_settings.aspirate.default[
                PIPETTING_FUNCTION_FALLBACK_VERSION
            ]
            sequence = pipette_settings.dispense.default.get(
                PIPETTING_FUNCTION_LATEST_VERSION, fallback
            )
        return piecewise_volume_conversion(ul, sequence)

    def get_pipette_type_from_engine(
        self, mount: Union[Mount, str]
    ) -> Optional[pip_types.PipetteNameType]:
        """Get the pipette attached to the given mount."""
        if isinstance(mount, Mount):
            engine_mount = MountType[mount.name]
        else:
            if mount.lower() == "right":
                engine_mount = MountType.RIGHT
            else:
                engine_mount = MountType.LEFT
        maybe_pipette = self._engine_client.state.pipettes.get_by_mount(engine_mount)
        return maybe_pipette.pipetteName if maybe_pipette else None

    def get_plunger_position_from_name(
        self, mount: Mount, position_name: PlungerPositionTypes
    ) -> float:
        maybe_pipette_state = self._sync_hardware_api.get_attached_instrument(mount)
        if not maybe_pipette_state:
            return 0.0
        return maybe_pipette_state["plunger_positions"][position_name.value]  # type: ignore[no-any-return]

    def get_plunger_position_from_volume(
        self, mount: Mount, volume: float, action: PipetteActionTypes, robot_type: str
    ) -> float:
        maybe_pipette_state = self._sync_hardware_api.get_attached_instrument(mount)
        if not maybe_pipette_state:
            return 0.0
        converted_working_volume = pip_types.PipetteTipType.check_and_return_type(
            maybe_pipette_state["working_volume"], maybe_pipette_state["max_volume"]
        )
        tip_settings = maybe_pipette_state["supported_tips"][converted_working_volume]
        plunger_bottom = maybe_pipette_state["plunger_positions"]["bottom"]

        convert_volume = self._ul_per_mm_conversion(tip_settings, volume, action)

        mm = volume / convert_volume
        if robot_type == "OT-2 Standard":
            position = plunger_bottom + mm
        else:
            position = plunger_bottom - mm
        return round(position, 6)  # type: ignore[no-any-return]

    def move_to(self, mount: Mount, destination: Point, speed: Optional[float]) -> None:
        engine_mount = MountType[mount.name]
        engine_destination = DeckPoint(
            x=destination.x, y=destination.y, z=destination.z
        )
        self._engine_client.execute_command(
            cmd.robot.MoveToParams(
                mount=engine_mount, destination=engine_destination, speed=speed
            )
        )

    def move_axes_to(
        self,
        axis_map: AxisMapType,
        critical_point: Optional[AxisMapType],
        speed: Optional[float],
    ) -> None:
        axis_engine_map = self._convert_to_engine_mount(axis_map)
        if critical_point:
            critical_point_engine = self._convert_to_engine_mount(critical_point)
        else:
            critical_point_engine = None

        self._engine_client.execute_command(
            cmd.robot.MoveAxesToParams(
                axis_map=axis_engine_map,
                critical_point=critical_point_engine,
                speed=speed,
            )
        )

    def move_axes_relative(self, axis_map: AxisMapType, speed: Optional[float]) -> None:
        axis_engine_map = self._convert_to_engine_mount(axis_map)
        self._engine_client.execute_command(
            cmd.robot.MoveAxesRelativeParams(axis_map=axis_engine_map, speed=speed)
        )
