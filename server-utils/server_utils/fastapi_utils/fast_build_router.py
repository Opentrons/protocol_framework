from __future__ import annotations

import dataclasses
import enum
import typing
import typing_extensions

import fastapi


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

    # `_SomethingCallableLike(FastAPI.foo)` produces a callable with the same signature
    # as `FastAPI.foo()`.
    class _SomethingCallableLike(typing.Generic[_P, _ReturnT]):
        def __init__(
            self,
            method_to_mimic: typing.Callable[
                typing.Concatenate[
                    fastapi.FastAPI,  # The `self` parameter, which we throw away.
                    _P,  # The actual args and kwargs, which we preserve.
                ],
                _ReturnT,
            ],
        ) -> None:
            raise NotImplementedError("This is only for type-checking, not runtime.")

        def __call__(self, *args: _P.args, **kwargs: _P.kwargs) -> _ReturnT:
            raise NotImplementedError("This is only for type-checking, not runtime.")

    class _FastAPIRouteMethods:
        get: typing.Final = _SomethingCallableLike(fastapi.FastAPI.get)
        put: typing.Final = _SomethingCallableLike(fastapi.FastAPI.put)
        post: typing.Final = _SomethingCallableLike(fastapi.FastAPI.post)
        delete: typing.Final = _SomethingCallableLike(fastapi.FastAPI.delete)
        options: typing.Final = _SomethingCallableLike(fastapi.FastAPI.options)
        head: typing.Final = _SomethingCallableLike(fastapi.FastAPI.head)
        patch: typing.Final = _SomethingCallableLike(fastapi.FastAPI.patch)
        trace: typing.Final = _SomethingCallableLike(fastapi.FastAPI.trace)

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
                combined_kwargs = _merge_kwargs(kwargs, route.inclusion_kwargs)
                if isinstance(router, fastapi.APIRouter):
                    app.include_router(router, **combined_kwargs)
                elif isinstance(route.router, FastBuildRouter):
                    router.install_on_app(app, **combined_kwargs)
            else:
                typing_extensions.assert_type(route, _Endpoint)
                combined_kwargs = _merge_kwargs(
                    kwargs,
                    route.kwargs,  # type: ignore[arg-type]
                )
                fastapi_method = getattr(app, route.method_name)
                fastapi_decorator = fastapi_method(*route.args, **combined_kwargs)
                fastapi_decorator(route.function)


class _RouterIncludeKwargs(typing.TypedDict):
    """The keyword arguments of `fastapi.APIRouter.include_router()`.

    (At least the ones that we care about, anyway.)
    """

    # Arguments with defaults should be annotated as `NotRequired`.
    # For example, `foo: str | None = None` becomes `NotRequired[str | None]`.
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


def _merge_kwargs(
    from_parent: _RouterIncludeKwargs, from_child: _RouterIncludeKwargs
) -> _RouterIncludeKwargs:
    """Merge kwargs from different levels of a FastAPI router tree.

    FastAPI keyword arguments can be specified at multiple levels in the router tree.
    For example, the top-level router, subrouters, and finally the endpoint function
    can each specify their own `tags`. The different levels need to be merged
    carefully and in argument-specific ways if we want to match FastAPI behavior.
    For example, `tags` should be the concatenation of all levels.
    """
    merge_result: _RouterIncludeKwargs = {}
    remaining_from_parent = from_parent.copy()
    remaining_from_child = from_child.copy()

    # When we know how to merge a specific argument's values, do so.
    # This takes care to leave the argument unset if it's unset in both parent and
    # child, in order to leave the defaulting up to FastAPI.
    if "tags" in remaining_from_parent or "tags" in remaining_from_child:
        merge_result["tags"] = [
            *(remaining_from_parent.get("tags") or []),
            *(remaining_from_child.get("tags") or []),
        ]
        remaining_from_parent.pop("tags", None)
        remaining_from_child.pop("tags", None)

    # For any argument whose values we don't know how to merge, we can just pass it
    # along opaquely, as long as the parent and child aren't both trying to set it.
    #
    # If the parent and child *are* both trying to set it, then we have a problem.
    # It would likely be wrong to arbitrarily choose one to override the other,
    # so we can only raise an error.
    colliding_keys = set(remaining_from_parent.keys()).intersection(
        remaining_from_child.keys()
    )
    if not colliding_keys:
        merge_result.update(remaining_from_parent)
        merge_result.update(remaining_from_child)
    else:
        a_collisions: dict[object, object] = {
            k: remaining_from_parent[k] for k in colliding_keys  # type: ignore[literal-required]
        }
        b_collisions: dict[object, object] = {
            k: remaining_from_child[k] for k in colliding_keys  # type: ignore[literal-required]
        }
        raise NotImplementedError(
            f"These FastAPI keyword arguments appear at different levels "
            f"in the router tree, and we don't know how to merge their values:\n"
            f"{a_collisions}\n{b_collisions}\n"
            f"Modify {__name__} to handle the merge, or avoid the problem by "
            f"setting the argument at only one level of the router tree."
        )

    return merge_result


@dataclasses.dataclass
class _IncludedRouter:
    router: fastapi.APIRouter | FastBuildRouter
    inclusion_kwargs: _RouterIncludeKwargs


DecoratedFunctionT = typing.TypeVar(
    "DecoratedFunctionT", bound=typing.Callable[..., object]
)


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
    ) -> typing.Callable[[DecoratedFunctionT], DecoratedFunctionT]:
        def decorate(decorated_function: DecoratedFunctionT) -> DecoratedFunctionT:
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
    """The name of the method on the FastAPI class, e.g. "get"."""

    args: tuple[object, ...]
    """The positional arguments passed to the FastAPI method, e.g. the URL path."""

    kwargs: dict[str, object]
    """The keyword arguments passed to the FastAPI method, e.g. `description`."""

    function: typing.Callable[..., object]
    """The function actually implementing the logic of the endpoint.

    (The "path operation function", in FastAPI terms.)
    """
