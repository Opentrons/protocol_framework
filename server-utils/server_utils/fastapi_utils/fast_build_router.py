from __future__ import annotations

import dataclasses
import enum
import functools
import typing
import typing_extensions

import fastapi


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


_FASTAPI_ROUTE_METHOD_NAMES = {
    "get",
    "put",
    "post",
    "delete",
    "options",
    "head",
    "patch",
    "trace",
}

if typing.TYPE_CHECKING:
    # This is some chicanery so that @router.get(...), @router.post(...), etc. give us
    # type-checking and autocomplete that exactly match the regular FastAPI version.
    # These methods have a lot of parameters with complicated types and it would be
    # a bear to manually keep them in sync with FastAPI.

    _P = typing.ParamSpec("_P")
    _ReturnT = typing.TypeVar("_ReturnT")

    class _MethodMimic(typing.Generic[_P, _ReturnT]):
        def __init__(
            self,
            method_to_mimic: typing.Callable[
                typing.Concatenate[
                    fastapi.FastAPI,  # The `self` parameter.
                    _P,  # The actual args and kwargs.
                ],
                _ReturnT,
            ],
        ) -> None:
            raise NotImplementedError("This is only for type-checking, not runtime.")

        def __call__(self, *args: _P.args, **kwargs: _P.kwargs) -> _ReturnT:
            raise NotImplementedError("This is only for type-checking, not runtime.")

    class _FastAPIRouteMethods:
        get: typing.Final = _MethodMimic(fastapi.FastAPI.get)
        put: typing.Final = _MethodMimic(fastapi.FastAPI.put)
        post: typing.Final = _MethodMimic(fastapi.FastAPI.post)
        delete: typing.Final = _MethodMimic(fastapi.FastAPI.delete)
        options: typing.Final = _MethodMimic(fastapi.FastAPI.options)
        head: typing.Final = _MethodMimic(fastapi.FastAPI.head)
        patch: typing.Final = _MethodMimic(fastapi.FastAPI.patch)
        trace: typing.Final = _MethodMimic(fastapi.FastAPI.trace)

else:

    class _FastAPIRouteMethods:
        pass


class FastBuildRouter(_FastAPIRouteMethods):
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
        self._routes: list[_Endpoint | _IncludedRouter] = []

    def __getattr__(self, name: str) -> object:
        if name in _FASTAPI_ROUTE_METHOD_NAMES:
            return _EndpointCaptor(method_name=name, on_capture=self._routes.append)
        else:
            raise AttributeError(name=name)

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
                    app.include_router(router, **combined_kwargs)
                elif isinstance(route.router, FastBuildRouter):
                    router.install_on_app(app, **combined_kwargs)
            else:
                typing_extensions.assert_type(route, _Endpoint)
                combined_kwargs = _inherit_include_kwargs(kwargs, route.kwargs)
                fastapi_method = getattr(app, route.method_name)
                fastapi_decorator = fastapi_method(*route.args, **combined_kwargs)
                fastapi_decorator(route.function)


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


class _EndpointCaptor:
    def __init__(
        self,
        method_name: str,
        on_capture: typing.Callable[[_Endpoint], None],
    ) -> None:
        """
        Params:
            method_name: The name of the method on the fastapi.FastAPI class that this
                should proxy, e.g. "get" or "post".
            on_capture: Called when we capture a call,
                i.e. when some router module does:

                @router.get("/foo")
                def get_foo() -> FooResponse:
                    ...
        """
        self._method_name = method_name
        self._on_capture = on_capture

    def __call__(
        self, *fastapi_decorator_args: object, **fastapi_decorator_kwargs: object
    ) -> _PassThroughDecorator:
        P = typing.ParamSpec("P")
        T = typing.TypeVar("T")

        def decorate(
            decorated_function: typing.Callable[P, T]
        ) -> typing.Callable[P, T]:
            self._on_capture(
                _Endpoint(
                    method_name=self._method_name,
                    args=fastapi_decorator_args,
                    kwargs=fastapi_decorator_kwargs,
                    function=decorated_function,
                )
            )

            return decorated_function

        return decorate


@dataclasses.dataclass
class _Endpoint:
    method_name: str
    args: tuple[object, ...]
    kwargs: dict[str, object]
    function: typing.Callable[..., object]
