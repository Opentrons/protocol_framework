# noqa: D100


import pytest

from decoy import Decoy

from robot_server.errors.error_responses import ApiError
from robot_server.runs.error_recovery_models import ErrorRecoveryPolicy
from robot_server.runs.router.error_recovery_policy_router import (
    put_error_recovery_policy,
)
from robot_server.runs.run_data_manager import RunDataManager, RunNotCurrentError
from robot_server.service.json_api.request import RequestModel


async def test_create_policies(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should call RunDataManager create run policies."""
    policies = decoy.mock(cls=ErrorRecoveryPolicy)
    await put_error_recovery_policy(
        runId="rud-id",
        request_body=RequestModel(data=policies),
        run_data_manager=mock_run_data_manager,
    )
    decoy.verify(
        mock_run_data_manager.set_error_recovery_rules(
            run_id="rud-id", rules=policies.policyRules
        )
    )


async def test_create_policies_raises_not_active_run(
    decoy: Decoy, mock_run_data_manager: RunDataManager
) -> None:
    """It should raise that the run is not current."""
    policies = decoy.mock(cls=ErrorRecoveryPolicy)
    decoy.when(
        mock_run_data_manager.set_error_recovery_rules(
            run_id="rud-id", rules=policies.policyRules
        )
    ).then_raise(RunNotCurrentError())
    with pytest.raises(ApiError) as exc_info:
        await put_error_recovery_policy(
            runId="rud-id",
            request_body=RequestModel(data=policies),
            run_data_manager=mock_run_data_manager,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"
