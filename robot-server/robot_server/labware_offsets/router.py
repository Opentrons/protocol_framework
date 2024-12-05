"""FastAPI endpoint functions for the `/labwareOffsets` endpoints."""


import textwrap
from typing import Annotated, Literal

import fastapi
from opentrons.protocol_engine import LabwareOffset, LabwareOffsetCreate

from robot_server.service.json_api.request import RequestModel
from robot_server.service.json_api.response import (
    PydanticResponse,
    SimpleBody,
    SimpleEmptyBody,
    SimpleMultiBody,
)


router = fastapi.APIRouter(prefix="/labwareOffsets")


@PydanticResponse.wrap_route(
    router.post,
    path="",
    summary="Store a labware offset",
    description=textwrap.dedent(
        """\
        Store a labware offset for later retrieval through `GET /labwareOffsets`.

        On its own, this does not affect robot motion.
        To do that, you must add the offset to a run, through the `/runs` endpoints.
        """
    ),
)
def post_labware_offset(  # noqa: D103
    new_offset: Annotated[RequestModel[LabwareOffsetCreate], fastapi.Body()]
) -> PydanticResponse[SimpleEmptyBody]:
    raise NotImplementedError()


@PydanticResponse.wrap_route(
    router.get,
    path="",
    summary="Search for labware offsets",
    description=(
        "Get a filtered list of all the labware offsets currently stored on the robot."
        " Filters are ANDed together."
        " Results are returned in order from oldest to newest."
    ),
)
def get_labware_offsets(  # noqa: D103
    id: Annotated[
        str | None,
        fastapi.Query(description="Filter for exact matches on the `id` field."),
    ] = None,
    definition_uri: Annotated[
        str | None,
        fastapi.Query(
            alias="definitionUri",
            description=(
                "Filter for exact matches on the `definitionUri` field."
                " (Not to be confused with `location.definitionUri`.)"
            ),
        ),
    ] = None,
    location_slot_name: Annotated[
        str | None,
        fastapi.Query(
            alias="location.slotName",
            description="Filter for exact matches on the `location.slotName` field.",
        ),
    ] = None,
    location_module_model: Annotated[
        str | None,
        fastapi.Query(
            alias="location.moduleModel",
            description="Filter for exact matches on the `location.moduleModel` field.",
        ),
    ] = None,
    location_definition_uri: Annotated[
        str | None,
        fastapi.Query(
            alias="location.definitionUri",
            description=(
                "Filter for exact matches on the `location.definitionUri` field."
                " (Not to be confused with just `definitionUri`.)"
            ),
        ),
    ] = None,
    cursor: Annotated[
        int | None,
        fastapi.Query(
            description=(
                "The first index to return out of the overall filtered result list."
                " If unspecified, defaults to returning `pageLength` elements from"
                " the end of the list."
            )
        ),
    ] = None,
    page_length: Annotated[
        int | Literal["unlimited"],
        fastapi.Query(
            alias="pageLength", description="The maximum number of entries to return."
        ),
    ] = "unlimited",
) -> PydanticResponse[SimpleMultiBody[LabwareOffset]]:
    raise NotImplementedError()


@PydanticResponse.wrap_route(
    router.delete,
    path="/{id}",
    summary="Delete a single labware offset",
    description="Delete a single labware offset. The deleted offset is returned.",
)
def delete_labware_offset(  # noqa: D103
    id: Annotated[
        str,
        fastapi.Path(description="The `id` field of the offset to delete."),
    ],
) -> PydanticResponse[SimpleBody[LabwareOffset]]:
    raise NotImplementedError()


@PydanticResponse.wrap_route(
    router.delete,
    path="",
    summary="Delete all labware offsets",
)
def delete_all_labware_offsets() -> PydanticResponse[SimpleEmptyBody]:  # noqa: D103
    raise NotImplementedError()
