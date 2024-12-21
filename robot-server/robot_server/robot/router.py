"""Router for /robot endpoints."""
from server_utils.fastapi_utils.fast_build_router import FastBuildRouter

from .control.router import control_router

robot_router = FastBuildRouter()

robot_router.include_router(router=control_router)
