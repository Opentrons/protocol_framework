from __future__ import annotations

import dataclasses
import enum
import functools
import typing
import typing_extensions

import fastapi


_ReturnT = typing.TypeVar("_ReturnT")
_ParamSpec = typing.ParamSpec("_ParamSpec")


# Annotations for a decorator that takes a function as input and returns the same function as output.
_PassThroughDecoratorParamSpec = typing.ParamSpec("_PassThroughDecoratorParamSpec")
_PassThroughDecoratorReturnT = typing.TypeVar("_PassThroughDecoratorReturnT")


class _PassThroughDecorator(typing.Protocol):
    """Describes a decorator that takes a function as input and passes it along as output.

    (This is how function decorators normally work.)
    """

    def __call__(
        self,
        function_input: typing.Callable[
            _PassThroughDecoratorParamSpec, _PassThroughDecoratorReturnT
        ],
        /,
    ) -> typing.Callable[_PassThroughDecoratorParamSpec, _PassThroughDecoratorReturnT]:
        ...


class _CallReplayer(typing.Protocol):
    def replay_on(
        self, app: fastapi.FastAPI, router_kwargs: _RouterIncludeKwargs
    ) -> None:
        ...
        # TODO: assert type(replay_on) is FastAPI.


class _CallCaptor(typing.Generic[_ParamSpec]):
    def __init__(
        self,
        method_to_emulate: typing.Callable[
            typing.Concatenate[fastapi.FastAPI, _ParamSpec], _PassThroughDecorator
        ],
        on_capture: typing.Callable[[_CallReplayer], None],
    ) -> None:
        """
        Params:
            method_to_emulate: The fastapi.FastAPI method to mimic, e.g.
                fastapi.FastAPI.get or fastapi.FastAPI.post.
            on_capture: Called when we capture a call,
                i.e. when some router module does:

                @router.get("/foo")
                def get_foo() -> FooResponse:
                    ...
        """
        self._fastapi_method = method_to_emulate
        self._on_capture = on_capture

    def __call__(
        self, *args: _ParamSpec.args, **kwargs: _ParamSpec.kwargs
    ) -> _PassThroughDecorator:
        P = typing.ParamSpec("P")
        T = typing.TypeVar("T")

        def decorate(endpoint_function: typing.Callable[P, T]) -> typing.Callable[P, T]:
            class ConcreteCallReplayer:
                @staticmethod
                def replay_on(
                    app: fastapi.FastAPI, router_kwargs: _RouterIncludeKwargs
                ) -> None:
                    # We are effectively going to call, for example, `app.get(...)` like
                    # `FastAPI.get(app, ...)`, sort of manually supplying the `self`
                    # argument to `FastAPI.get`. Since this bypasses normal method
                    # resolution, I am pretty sure it would run the wrong code if
                    # someone passed us a subclass of `FastAPI` instead of an actual
                    # `FastAPI`.
                    assert type(app) is fastapi.FastAPI

                    nonlocal args
                    nonlocal kwargs
                    # TODO: See "Rejected Alternatives > Concatenating Keyword Parameters" in PEP 612)
                    # TODO: Combine with reducer func
                    kwargs = _inherit_include_kwargs(router_kwargs, kwargs)  # type: ignore

                    fastapi_decorator = self._fastapi_method(app, *args, **kwargs)

                    fastapi_decorator(endpoint_function)

            self._on_capture(ConcreteCallReplayer())

            return endpoint_function

        return decorate


class FastBuildRouter:
    """An optimized, stripped-down, drop-in replacement for `fastapi.APIRouter`.

    An essential part of the way we organize our code is to have a tree of topic-based
    subdirectories that each define their own HTTP routes with a local
    `fastapi.APIRouter`, and then combine those into a single `fastapi.FastAPI` app.

    Unfortunately, the standard FastAPI way of doing this, with
    `APIRouter.include_router()` and `FastAPI.include_router()`, appears to have severe
    performance problems. Supposedly, the bad performance has to do with reduntantly
    constructing Pydantic objects at each level of nesting
    (https://github.com/pydantic/pydantic/issues/6768#issuecomment-1644532429).
    This severely impacts server startup time.

    This class, a reimplementation of the `fastapi.APIRouter` interface, fixes that.
    This gives something like a 1.6x speedup for `import robot_server.app`.
    Not all features of `fastapi.APIRouter` are supported,
    only the ones that we actually need.
    """

    def __init__(self) -> None:
        self._routes: list[_CallReplayer | _IncludedRouter] = []

        self.get: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.get, on_capture=self._routes.append
        )
        self.put: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.put, on_capture=self._routes.append
        )
        self.post: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.post, on_capture=self._routes.append
        )
        self.delete: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.delete, on_capture=self._routes.append
        )
        self.options: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.options, on_capture=self._routes.append
        )
        self.head: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.head, on_capture=self._routes.append
        )
        self.patch: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.patch, on_capture=self._routes.append
        )
        self.trace: typing.Final = _CallCaptor(
            method_to_emulate=fastapi.FastAPI.trace, on_capture=self._routes.append
        )

    def include_router(
        self,
        router: FastBuildRouter | fastapi.APIRouter,
        **kwargs: typing_extensions.Unpack[_RouterIncludeKwargs],
    ) -> None:
        """The optimized version of `fastapi.APIRouter.include_router()`."""  # noqa: D402
        self._routes.append(_IncludedRouter(router=router, inclusion_kwargs=kwargs))

    def install_on_app(
        self,
        app: fastapi.FastAPI,
        **kwargs: typing_extensions.Unpack[_RouterIncludeKwargs],
    ) -> None:
        """The optimized version of `fastapi.FastAPI.include_router()`."""
        for route in self._routes:
            if isinstance(route, _IncludedRouter):
                router = route.router
                combined_kwargs = _inherit_include_kwargs(
                    kwargs, route.inclusion_kwargs
                )
                if isinstance(router, fastapi.APIRouter):
                    # TODO: May need to pass along tags and deps
                    app.include_router(router, **combined_kwargs)
                elif isinstance(route.router, FastBuildRouter):
                    router.install_on_app(app, **combined_kwargs)
            else:
                # TODO: May need to pass along tags and deps, or at least assert
                # that there is no conflict.
                route.replay_on(app, kwargs)


class _RouterIncludeKwargs(typing.TypedDict):
    """The keyword arguments of `fastapi.APIRouter.include_router()`.

    (At least the ones that we care about, anyway.)

    We do this because we need to get at these variables, e.g. Depends[] is supposed to be
    accumulated
    """

    # Arguments with defaults should be noted as NotRequired
    tags: typing_extensions.NotRequired[list[str | enum.Enum] | None]
    responses: typing_extensions.NotRequired[
        dict[int | str, dict[str, typing.Any]] | None
    ]
    dependencies: typing_extensions.NotRequired[
        typing.Sequence[
            # FastAPI does not publicly expose the type of the result of a
            # Depends(...) call, so this needs to be Any.
            typing.Any
        ]
        | None
    ]


def _inherit_include_kwargs(
    a: _RouterIncludeKwargs, b: _RouterIncludeKwargs
) -> _RouterIncludeKwargs:
    a = a.copy()
    b = b.copy()

    result: _RouterIncludeKwargs = {}
    if "tags" in a or "tags" in b:
        result["tags"] = [*(a.get("tags") or []), *(b.get("tags") or [])]
        a.pop("tags", None)
        b.pop("tags", None)

    colliding_keys = set(a.keys()).intersection(b.keys())
    if colliding_keys:
        a_collisions: dict[object, object] = {k: a[k] for k in colliding_keys}
        b_collisions: dict[object, object] = {k: b[k] for k in colliding_keys}
        raise NotImplementedError(
            f"These FastAPI keyword arguments appear at different levels"
            f" in the route tree, and we don't know how to combine them:"
            f" {a_collisions}, {b_collisions}"
        )

    result.update(a)
    result.update(b)

    return result


@dataclasses.dataclass
class _IncludedRouter:
    router: fastapi.APIRouter | FastBuildRouter
    inclusion_kwargs: _RouterIncludeKwargs
