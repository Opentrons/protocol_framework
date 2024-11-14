"""Base command data model and type definitions."""


from __future__ import annotations

import dataclasses
from abc import ABC, abstractmethod
from datetime import datetime
import enum
from typing import (
    cast,
    TYPE_CHECKING,
    Generic,
    Optional,
    TypeVar,
    List,
    Type,
    Union,
    Callable,
    Awaitable,
    Literal,
    Final,
    TypeAlias,
)

from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

from opentrons.hardware_control import HardwareControlAPI
from opentrons.protocol_engine.state.update_types import StateUpdate

from ..resources import ModelUtils
from ..errors import ErrorOccurrence
from ..notes import CommandNote, CommandNoteAdder

# Work around type-only circular dependencies.
if TYPE_CHECKING:
    from .. import execution
    from ..state.state import StateView


_ParamsT = TypeVar("_ParamsT", bound=BaseModel)
_ParamsT_contra = TypeVar("_ParamsT_contra", bound=BaseModel, contravariant=True)
_ResultT = TypeVar("_ResultT", bound=BaseModel)
_ResultT_co = TypeVar("_ResultT_co", bound=BaseModel, covariant=True)
_ErrorT = TypeVar("_ErrorT", bound=ErrorOccurrence)
_ErrorT_co = TypeVar("_ErrorT_co", bound=ErrorOccurrence, covariant=True)


class CommandStatus(str, enum.Enum):
    """Command execution status."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class CommandIntent(str, enum.Enum):
    """Run intent for a given command.

    Props:
        PROTOCOL: the command is part of the protocol run itself.
        SETUP: the command is part of the setup phase of a run.
    """

    PROTOCOL = "protocol"
    SETUP = "setup"
    FIXIT = "fixit"


class BaseCommandCreate(
    GenericModel,
    # These type parameters need to be invariant because our fields are mutable.
    Generic[_ParamsT],
):
    """Base class for command creation requests.

    You shouldn't use this class directly; instead, use or define
    your own subclass per specific command type.
    """

    commandType: str = Field(
        ...,
        description=(
            "Specific command type that determines data requirements and "
            "execution behavior"
        ),
    )
    params: _ParamsT = Field(..., description="Command execution data payload")
    intent: Optional[CommandIntent] = Field(
        None,
        description=(
            "The reason the command was added. If not specified or `protocol`,"
            " the command will be treated as part of the protocol run itself,"
            " and added to the end of the existing command queue."
            "\n\n"
            "If `setup`, the command will be treated as part of run setup."
            " A setup command may only be enqueued if the run has not started."
            "\n\n"
            "Use setup commands for activities like pre-run calibration checks"
            " and module setup, like pre-heating."
        ),
    )
    key: Optional[str] = Field(
        None,
        description=(
            "A key value, unique in this run, that can be used to track"
            " the same logical command across multiple runs of the same protocol."
            " If a value is not provided, one will be generated."
        ),
    )


@dataclasses.dataclass(frozen=True)
class SuccessData(Generic[_ResultT_co]):
    """Data from the successful completion of a command."""

    public: _ResultT_co
    """Public result data. Exposed over HTTP and stored in databases."""

    state_update: StateUpdate = dataclasses.field(
        # todo(mm, 2024-08-22): Remove the default once all command implementations
        # use this, to make it harder to forget in new command implementations.
        default_factory=StateUpdate
    )
    """How the engine state should be updated to reflect this command success."""


@dataclasses.dataclass(frozen=True)
class DefinedErrorData(Generic[_ErrorT_co]):
    """Data from a command that failed with a defined error.

    This should only be used for "defined" errors, not any error.
    See `AbstractCommandImpl.execute()`.
    """

    public: _ErrorT_co
    """Public error data. Exposed over HTTP and stored in databases."""

    state_update: StateUpdate = dataclasses.field(
        # todo(mm, 2024-08-22): Remove the default once all command implementations
        # use this, to make it harder to forget in new command implementations.
        default_factory=StateUpdate
    )
    """How the engine state should be updated to reflect this command failure."""

    state_update_if_false_positive: StateUpdate = dataclasses.field(
        default_factory=StateUpdate
    )


class BaseCommand(
    GenericModel,
    # These type parameters need to be invariant because our fields are mutable.
    Generic[_ParamsT, _ResultT, _ErrorT],
):
    """Base command model.

    You shouldn't use this class directly; instead, use or define
    your own subclass per specific command type.
    """

    id: str = Field(
        ...,
        description="Unique identifier of this particular command instance",
    )
    createdAt: datetime = Field(..., description="Command creation timestamp")
    commandType: str = Field(
        ...,
        description=(
            "Specific command type that determines data requirements and "
            "execution behavior"
        ),
    )
    key: str = Field(
        ...,
        description=(
            "An identifier representing this command as a step in a protocol."
            " A command's `key` will be unique within a given run, but stable"
            " across all runs that perform the same exact procedure. Thus,"
            " `key` be used to compare/match commands across multiple runs"
            " of the same protocol."
        ),
    )
    status: CommandStatus = Field(..., description="Command execution status")
    params: _ParamsT = Field(..., description="Command execution data payload")
    result: Optional[_ResultT] = Field(
        None,
        description="Command execution result data, if succeeded",
    )
    error: Union[
        _ErrorT,
        # ErrorOccurrence here is for undefined errors not captured by _ErrorT.
        ErrorOccurrence,
        None,
    ] = Field(
        None,
        description="Reference to error occurrence, if execution failed",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Command execution start timestamp, if started",
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Command execution completed timestamp, if completed",
    )
    intent: Optional[CommandIntent] = Field(
        None,
        description=(
            "The reason the command was added to the run."
            " If not specified or `protocol`, it is part of the protocol itself."
            " If `setup`, it was added as part of setup; for example,"
            " a command that is part of a calibration procedure."
        ),
    )
    notes: Optional[List[CommandNote]] = Field(
        None,
        description=(
            "Information not critical to the execution of the command derived from either"
            " the command's execution or the command's generation."
        ),
    )
    failedCommandId: Optional[str] = Field(
        None,
        description=(
            "FIXIT command use only. Reference of the failed command id we are trying to fix."
        ),
    )

    _ImplementationCls: Type[
        AbstractCommandImpl[
            _ParamsT,
            Union[
                SuccessData[
                    # Our _ImplementationCls must return public result data that can fit
                    # in our `result` field:
                    _ResultT,
                ],
                DefinedErrorData[
                    # Our _ImplementationCls must return public error data that can fit
                    # in our `error` field:
                    _ErrorT,
                ],
            ],
        ]
    ]


class IsErrorValue(Exception):
    """Panic exception if a Maybe contains an Error."""

    pass


class _NothingEnum(enum.Enum):
    _NOTHING = enum.auto()


NOTHING: Final = _NothingEnum._NOTHING
NothingT: TypeAlias = Literal[_NothingEnum._NOTHING]


class _UnknownEnum(enum.Enum):
    _UNKNOWN = enum.auto()


UNKNOWN: Final = _UnknownEnum._UNKNOWN
UnknownT: TypeAlias = Literal[_UnknownEnum._UNKNOWN]

_ResultT_co_general = TypeVar("_ResultT_co_general", covariant=True)
_ErrorT_co_general = TypeVar("_ErrorT_co_general", covariant=True)


_SecondResultT_co_general = TypeVar("_SecondResultT_co_general", covariant=True)
_SecondErrorT_co_general = TypeVar("_SecondErrorT_co_general", covariant=True)


@dataclasses.dataclass
class Maybe(Generic[_ResultT_co_general, _ErrorT_co_general]):
    """Represents an possibly completed, possibly errored result.

    By using this class's chaining methods like and_then or or_else, you can build
    functions that preserve previous defined errors and augment them or transform them
    and transform the results.

    Build objects of this type using from_result or from_error on fully type-qualified
    aliases. For instance,

    MyFunctionReturn = Maybe[SuccessData[SomeSuccessModel], DefinedErrorData[SomeErrorKind]]

    def my_function(args...) -> MyFunctionReturn:
        try:
            do_thing(args...)
        except SomeException as e:
            return MyFunctionReturn.from_error(ErrorOccurrence.from_error(e))
        else:
            return MyFunctionReturn.from_result(SuccessData(SomeSuccessModel(args...)))

    Then, in the calling function, you can react to the results and unwrap to a union:

    OuterMaybe = Maybe[SuccessData[SomeOtherModel], DefinedErrorData[SomeErrors]]
    OuterReturn = Union[SuccessData[SomeOtherModel], DefinedErrorData[SomeErrors]]

    def my_calling_function(args...) -> OuterReturn:
        def handle_result(result: SuccessData[SomeSuccessModel]) -> OuterMaybe:
            return OuterMaybe.from_result(result=some_result_transformer(result))
        return do_thing.and_then(handle_result).unwrap()
    """

    _contents: tuple[_ResultT_co_general, NothingT] | tuple[
        NothingT, _ErrorT_co_general
    ]

    _CtorErrorT = TypeVar("_CtorErrorT")
    _CtorResultT = TypeVar("_CtorResultT")

    @classmethod
    def from_result(
        cls: Type[Maybe[_CtorResultT, _CtorErrorT]], result: _CtorResultT
    ) -> Maybe[_CtorResultT, _CtorErrorT]:
        """Build a Maybe from a valid result."""
        return cls(_contents=(result, NOTHING))

    @classmethod
    def from_error(
        cls: Type[Maybe[_CtorResultT, _CtorErrorT]], error: _CtorErrorT
    ) -> Maybe[_CtorResultT, _CtorErrorT]:
        """Build a Maybe from a known error."""
        return cls(_contents=(NOTHING, error))

    def result_or_panic(self) -> _ResultT_co_general:
        """Unwrap to a result or throw if the Maybe is an error."""
        contents = self._contents
        if contents[1] is NOTHING:
            # https://github.com/python/mypy/issues/12364
            return cast(_ResultT_co_general, contents[0])
        else:
            raise IsErrorValue()

    def unwrap(self) -> _ResultT_co_general | _ErrorT_co_general:
        """Unwrap to a union, which is useful for command returns."""
        # https://github.com/python/mypy/issues/12364
        if self._contents[1] is NOTHING:
            return cast(_ResultT_co_general, self._contents[0])
        else:
            return self._contents[1]

    # note: casts in these methods  are because of https://github.com/python/mypy/issues/11730
    def and_then(
        self,
        functor: Callable[
            [_ResultT_co_general],
            Maybe[_SecondResultT_co_general, _SecondErrorT_co_general],
        ],
    ) -> Maybe[
        _SecondResultT_co_general, _ErrorT_co_general | _SecondErrorT_co_general
    ]:
        """Conditionally execute functor if the Maybe contains a result.

        Functor should take the result type and return a new Maybe. Since this function returns
        a Maybe, it can be chained. The result type will have only the Result type of the Maybe
        returned by the functor, but the error type is the union of the error type in the Maybe
        returned by the functor and the error type in this Maybe, since the functor may not have
        actually been called.
        """
        match self._contents:
            case (result, _NothingEnum._NOTHING):
                return cast(
                    Maybe[
                        _SecondResultT_co_general,
                        _ErrorT_co_general | _SecondErrorT_co_general,
                    ],
                    functor(cast(_ResultT_co_general, result)),
                )
            case _:
                return cast(
                    Maybe[
                        _SecondResultT_co_general,
                        _ErrorT_co_general | _SecondErrorT_co_general,
                    ],
                    self,
                )

    def or_else(
        self,
        functor: Callable[
            [_ErrorT_co_general],
            Maybe[_SecondResultT_co_general, _SecondErrorT_co_general],
        ],
    ) -> Maybe[
        _SecondResultT_co_general | _ResultT_co_general, _SecondErrorT_co_general
    ]:
        """Conditionally execute functor if the Maybe contains an error.

        The functor should take the error type and return a new Maybe. Since this function returns
        a Maybe, it can be chained. The result type will have only the Error type of the Maybe
        returned by the functor, but the result type is the union of the Result of the Maybe returned
        by the functor and the Result of this Maybe, since the functor may not have been called.
        """
        match self._contents:
            case (_NothingEnum._NOTHING, error):
                return cast(
                    Maybe[
                        _ResultT_co_general | _SecondResultT_co_general,
                        _SecondErrorT_co_general,
                    ],
                    functor(cast(_ErrorT_co_general, error)),
                )
            case _:
                return cast(
                    Maybe[
                        _ResultT_co_general | _SecondResultT_co_general,
                        _SecondErrorT_co_general,
                    ],
                    self,
                )

    async def and_then_async(
        self,
        functor: Callable[
            [_ResultT_co_general],
            Awaitable[Maybe[_SecondResultT_co_general, _SecondErrorT_co_general]],
        ],
    ) -> Awaitable[
        Maybe[_SecondResultT_co_general, _ErrorT_co_general | _SecondErrorT_co_general]
    ]:
        """As and_then, but for an async functor."""
        match self._contents:
            case (result, _NothingEnum._NOTHING):
                return cast(
                    Awaitable[
                        Maybe[
                            _SecondResultT_co_general,
                            _ErrorT_co_general | _SecondErrorT_co_general,
                        ]
                    ],
                    await functor(cast(_ResultT_co_general, result)),
                )
            case _:
                return cast(
                    Awaitable[
                        Maybe[
                            _SecondResultT_co_general,
                            _ErrorT_co_general | _SecondErrorT_co_general,
                        ]
                    ],
                    self,
                )

    async def or_else_async(
        self,
        functor: Callable[
            [_ErrorT_co_general],
            Awaitable[Maybe[_SecondResultT_co_general, _SecondErrorT_co_general]],
        ],
    ) -> Awaitable[
        Maybe[_SecondResultT_co_general | _ResultT_co_general, _SecondErrorT_co_general]
    ]:
        """As or_else, but for an async functor."""
        match self._contents:
            case (_NothingEnum._NOTHING, error):
                return cast(
                    Awaitable[
                        Maybe[
                            _ResultT_co_general | _SecondResultT_co_general,
                            _SecondErrorT_co_general,
                        ]
                    ],
                    await functor(cast(_ErrorT_co_general, error)),
                )
            case _:
                return cast(
                    Awaitable[
                        Maybe[
                            _ResultT_co_general | _SecondResultT_co_general,
                            _SecondErrorT_co_general,
                        ]
                    ],
                    self,
                )


_ExecuteReturnT_co = TypeVar(
    "_ExecuteReturnT_co",
    bound=Union[
        SuccessData[BaseModel],
        DefinedErrorData[ErrorOccurrence],
    ],
    covariant=True,
)


class AbstractCommandImpl(
    ABC,
    Generic[_ParamsT_contra, _ExecuteReturnT_co],
):
    """Abstract command creation and execution implementation.

    A given command request should map to a specific command implementation,
    which defines how to execute the command and map data from execution into the
    result model.
    """

    def __init__(
        self,
        state_view: StateView,
        hardware_api: HardwareControlAPI,
        equipment: execution.EquipmentHandler,
        file_provider: execution.FileProvider,
        movement: execution.MovementHandler,
        gantry_mover: execution.GantryMover,
        labware_movement: execution.LabwareMovementHandler,
        pipetting: execution.PipettingHandler,
        tip_handler: execution.TipHandler,
        run_control: execution.RunControlHandler,
        rail_lights: execution.RailLightsHandler,
        model_utils: ModelUtils,
        status_bar: execution.StatusBarHandler,
        command_note_adder: CommandNoteAdder,
    ) -> None:
        """Initialize the command implementation with execution handlers."""
        pass

    @abstractmethod
    async def execute(self, params: _ParamsT_contra) -> _ExecuteReturnT_co:
        """Execute the command, mapping data from execution into a response model.

        This should either:

        - Return a `SuccessData`, if the command completed normally.
        - Return a `DefinedErrorData`, if the command failed with a "defined error."
          Defined errors are errors that are documented as part of the robot's public
          API.
        - Raise an exception, if the command failed with any other error
          (in other words, an undefined error).
        """
        ...
