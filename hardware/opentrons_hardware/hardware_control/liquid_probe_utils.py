"""Functions for commanding motion limited by tool sensors."""
from typing import (
    Any,
    List,
    Tuple,
    Dict,
    Optional,
)
from logging import getLogger
from numpy import float64
from math import copysign
from typing_extensions import Literal
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    SensorId,
    SensorType,
    SensorOutputBinding,
)
from opentrons_hardware.firmware_bindings.messages import (
    message_definitions,
    MessageDefinition,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.hardware_control.motion import (
    MoveStopCondition,
    create_step,
    MoveGroupStep,
    MoveGroupSingleAxisStep,
)
from opentrons_hardware.hardware_control.types import (
    MoveCompleteAck,
)

LOG = getLogger(__name__)


PipetteProbeTarget = Literal[NodeId.pipette_left, NodeId.pipette_right]


class ProbeResultListener:
    """Can bus listener to find the success point of a liquid probe."""

    def __init__(
        self,
        messenger: CanMessenger,
        head_node: NodeId,
    ) -> None:
        """Build a new listener."""
        self.head_node = head_node
        self.success = False
        self.result: Tuple[float, float] = (0.0, 0.0)
        self.messenger = messenger

    def probe_successful(self) -> bool:
        """Return true if the listener heard a successful completion."""
        return self.success

    def probe_result(self) -> Tuple[float, float]:
        """Return a Tuple of the encoder and stepper position where liquid was found."""
        return self.result

    async def __aenter__(self) -> None:
        """Start logging sensor readings."""
        self.messenger.add_listener(self, None)

    async def __aexit__(self, *args: Any) -> None:
        """Finish the capture."""
        self.messenger.remove_listener(self)

    def __call__(
        self,
        message: MessageDefinition,
        arbitration_id: ArbitrationId,
    ) -> None:
        """Callback entry point for capturing messages."""
        if arbitration_id.parts.originating_node_id != self.head_node:
            # check that this is from the node we care about
            return
        if isinstance(message, message_definitions.MoveCompleted) or isinstance(
            message, message_definitions.MoveConditionMet
        ):
            if (
                message.payload.ack_id.value
                == MoveCompleteAck.stopped_by_condition.value
                and not self.success
            ):
                self.success = True
                self.result = (
                    float(message.payload.current_position_um.value) / 1000.0,
                    float(message.payload.encoder_position_um.value) / 1000.0,
                )


def _build_group_for_trapazoid(
    head_node: NodeId,
    tool: NodeId,
    plunger_speed: float,
    max_mount_speed: float,
    mount_discontinuity: float,
    mount_acceleration: float,
    z_acceleration_distance: float,
    z_flat_speed_distance: float,
    p_prep_distance: float,
    p_pass_distance: float,
    plunger_impulse_time: float,
    sensor_id: SensorId,
    binding_flags: Optional[int] = None,
) -> List[MoveGroupStep]:

    prep_step = create_step(
        distance={
            head_node: float64(z_acceleration_distance),
            tool: float64(p_prep_distance),
        },
        velocity={
            head_node: float64(mount_discontinuity),
            tool: float64(plunger_speed),
        },
        acceleration={head_node: float64(mount_acceleration)},
        duration=float64(plunger_impulse_time),
        present_nodes=[head_node, tool],
    )

    flat_step_plunger = _build_pass_step(
        movers=[tool],
        distance={tool: p_pass_distance},
        speed={tool: plunger_speed},
        sensor_type=SensorType.pressure,
        sensor_id=sensor_id,
        stop_condition=MoveStopCondition.sync_line,
        binding_flags=binding_flags,
    )
    flat_step_plunger = _fix_pass_step_for_buffer(
        flat_step_plunger,
        movers=[tool],
        distance={tool: p_pass_distance},
        speed={tool: plunger_speed},
        sensor_type=SensorType.pressure,
        sensor_id=sensor_id,
        binding_flags=binding_flags,
    )
    flat_step_mount = create_step(
        distance={head_node: float64(z_flat_speed_distance)},
        velocity={head_node: float64(max_mount_speed)},
        acceleration={},
        duration=float64(p_pass_distance / plunger_speed - plunger_impulse_time),
        present_nodes=[head_node],
        stop_condition=MoveStopCondition.sync_line,
    )

    flat_step = flat_step_plunger | flat_step_mount

    decel_step = create_step(
        distance={head_node: float64(z_acceleration_distance)},
        velocity={head_node: float64(max_mount_speed)},
        acceleration={head_node: float64(-1 * mount_acceleration)},
        duration=float64(plunger_impulse_time),
        present_nodes=[head_node],
        stop_condition=MoveStopCondition.sync_line,
    )
    decel_step[head_node] = MoveGroupSingleAxisStep(
        distance_mm=decel_step[head_node].distance_mm,  # type: ignore[union-attr]
        velocity_mm_sec=decel_step[head_node].velocity_mm_sec,  # type: ignore[union-attr]
        duration_sec=decel_step[head_node].duration_sec,
        acceleration_mm_sec_sq=decel_step[head_node].acceleration_mm_sec_sq,  # type: ignore[union-attr]
        stop_condition=MoveStopCondition.sync_line.value
        + MoveStopCondition.encoder_position_or_safe_stop.value,
        move_type=decel_step[head_node].move_type,  # type: ignore[union-attr]
        sensor_type=decel_step[head_node].sensor_type,  # type: ignore[union-attr]
        sensor_id=decel_step[head_node].sensor_id,  # type: ignore[union-attr]
        sensor_binding_flags=decel_step[head_node].sensor_binding_flags,  # type: ignore[union-attr]
    )
    return [prep_step, flat_step, decel_step]


def _fix_pass_step_for_buffer(
    move_group: MoveGroupStep,
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    sensor_type: SensorType,
    sensor_id: SensorId,
    binding_flags: Optional[int] = None,
) -> MoveGroupStep:
    if binding_flags is None:
        binding_flags = (
            SensorOutputBinding.auto_baseline_report
            + SensorOutputBinding.sync
            + SensorOutputBinding.report
        )
    tool_nodes = [
        i
        for i in movers
        if i in [NodeId.pipette_left, NodeId.pipette_right, NodeId.gripper]
    ]
    if sensor_type == SensorType.pressure:
        tool_move = create_step(
            distance={ax: float64(abs(distance[ax])) for ax in movers},
            velocity={
                ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
            },
            acceleration={},
            # use any node present to calculate duration of the move, assuming the durations
            #   will be the same
            duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
            present_nodes=tool_nodes,
            stop_condition=MoveStopCondition.sensor_report,
            sensor_type_pass=sensor_type,
            sensor_id_pass=sensor_id,
            sensor_binding_flags=binding_flags,
        )
    elif sensor_type == SensorType.capacitive:
        tool_move = create_step(
            distance={},
            velocity={},
            acceleration={},
            # use any node present to calculate duration of the move, assuming the durations
            #   will be the same
            duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
            present_nodes=tool_nodes,
            stop_condition=MoveStopCondition.sync_line,
            sensor_type_pass=sensor_type,
            sensor_id_pass=sensor_id,
            sensor_binding_flags=binding_flags,
        )
    for node in tool_nodes:
        move_group[node] = tool_move[node]
    return move_group


def _build_pass_step(
    movers: List[NodeId],
    distance: Dict[NodeId, float],
    speed: Dict[NodeId, float],
    sensor_type: SensorType,
    sensor_id: SensorId,
    stop_condition: MoveStopCondition = MoveStopCondition.sync_line,
    binding_flags: Optional[int] = None,
) -> MoveGroupStep:
    move_group = create_step(
        distance={ax: float64(abs(distance[ax])) for ax in movers},
        velocity={
            ax: float64(speed[ax] * copysign(1.0, distance[ax])) for ax in movers
        },
        acceleration={},
        # use any node present to calculate duration of the move, assuming the durations
        #   will be the same
        duration=float64(abs(distance[movers[0]] / speed[movers[0]])),
        present_nodes=movers,
        stop_condition=stop_condition,
        sensor_type_pass=sensor_type,
        sensor_id_pass=sensor_id,
        sensor_binding_flags=binding_flags,
    )
    return move_group


def plan_liquid_probe_motion(
    tool: PipetteProbeTarget,
    head_node: NodeId,
    max_p_distance: float,
    plunger_speed: float,
    max_mount_speed: float,
    mount_discontinuity: float,
    mount_acceleration: float,
    plunger_impulse_time: float,
    z_offset_for_plunger_prep: float,
    sensor_id: SensorId,
    sensor_binding: Optional[int],
    use_fast_motion: bool,
) -> Tuple[List[MoveGroupStep], List[MoveGroupStep]]:
    """Plan the move group for a liquid probe depending on the settings.

    Returns the probing move group and the raise_z move group.
    """
    p_prep_distance = float(plunger_impulse_time * plunger_speed)
    p_pass_distance = float(max_p_distance - p_prep_distance)

    if use_fast_motion:
        z_flat_time = float(p_pass_distance / plunger_speed) - 2 * plunger_impulse_time
        # TODO: handle this better
        assert z_flat_time > 0
        z_acceleration_distance = (
            mount_discontinuity * plunger_impulse_time + 0.5 * mount_acceleration*plunger_impulse_time**2
        )
        z_flat_speed_distance = z_flat_time * max_mount_speed
        move_group = _build_group_for_trapazoid(
            head_node,
            tool,
            plunger_speed,
            max_mount_speed,
            mount_discontinuity,
            mount_acceleration,
            z_acceleration_distance,
            z_flat_speed_distance,
            p_prep_distance,
            p_pass_distance,
            plunger_impulse_time,
            sensor_id,
            sensor_binding,
        )
        z_rise_height = z_offset_for_plunger_prep + z_acceleration_distance
    else:
        max_z_distance = (p_pass_distance / plunger_speed) * mount_discontinuity
        lower_plunger = create_step(
            distance={tool: float64(p_prep_distance)},
            velocity={tool: float64(plunger_speed)},
            acceleration={},
            duration=float64(plunger_impulse_time),
            present_nodes=[tool],
        )

        sensor_group = _build_pass_step(
            movers=[head_node, tool],
            distance={head_node: max_z_distance, tool: p_pass_distance},
            speed={head_node: mount_discontinuity, tool: plunger_speed},
            sensor_type=SensorType.pressure,
            sensor_id=sensor_id,
            stop_condition=MoveStopCondition.sync_line,
            binding_flags=sensor_binding,
        )

        sensor_group = _fix_pass_step_for_buffer(
            sensor_group,
            movers=[head_node, tool],
            distance={head_node: max_z_distance, tool: p_pass_distance},
            speed={head_node: mount_discontinuity, tool: plunger_speed},
            sensor_type=SensorType.pressure,
            sensor_id=sensor_id,
            binding_flags=sensor_binding,
        )
        move_group = [lower_plunger, sensor_group]
        z_rise_height = z_offset_for_plunger_prep
    print(f"Creating raise z step dist {z_rise_height} vel {mount_discontinuity} duration {z_rise_height / mount_discontinuity}")
    raise_z = create_step(
        distance={head_node: float64(z_rise_height)},
        velocity={head_node: float64(-1 * mount_discontinuity)},
        acceleration={},
        duration=float64(z_rise_height / mount_discontinuity),
        present_nodes=[head_node],
    )
    return (move_group, [raise_z])
