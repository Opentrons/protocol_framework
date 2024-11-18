import { useMemo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FAILED,
  RUN_STATUS_FINISHING,
  RUN_STATUS_IDLE,
  RUN_STATUS_PAUSED,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  getLoadedLabwareDefinitionsByUri,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { useHost } from '@opentrons/react-api-client'

import { getIsOnDevice } from '/app/redux/config'
import { ErrorRecoveryWizard, useERWizard } from './ErrorRecoveryWizard'
import { RecoverySplash, useRecoverySplash } from './RecoverySplash'
import { RecoveryTakeover } from './RecoveryTakeover'
import {
  useCurrentlyRecoveringFrom,
  useERUtils,
  useRecoveryTakeover,
  useRetainedFailedCommandBySource,
} from './hooks'

import type { RunStatus } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { FailedCommand } from './types'

const VALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
]

// Effectively statuses that are not an "awaiting-recovery" status OR "stop requested."
const INVALID_ER_RUN_STATUSES: RunStatus[] = [
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSED,
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_FINISHING,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
  RUN_STATUS_IDLE,
]

export interface UseErrorRecoveryResult {
  isERActive: boolean
  failedCommand: FailedCommand | null
}

export function useErrorRecoveryFlows(
  runId: string,
  runStatus: RunStatus | null
): UseErrorRecoveryResult {
  const [isERActive, setIsERActive] = useState(false)
  const [hasSeenAwaitingRecovery, setHasSeenAwaitingRecovery] = useState(false)
  const failedCommand = useCurrentlyRecoveringFrom(runId, runStatus)

  // The complexity of this logic exists to persist Error Recovery screens past the server's definition of Error Recovery.
  // Ex, show a "cancelling run" modal in Error Recovery flows despite the robot no longer being in a recoverable state.

  const isValidERStatus = (status: RunStatus | null): boolean => {
    return (
      status !== null &&
      VALID_ER_RUN_STATUSES.includes(status) &&
      (status === RUN_STATUS_AWAITING_RECOVERY || hasSeenAwaitingRecovery)
    )
  }

  // If client accesses a valid ER runs status besides AWAITING_RECOVERY but accesses it outside of Error Recovery flows,
  // don't show ER.
  useEffect(() => {
    if (runStatus != null) {
      const isAwaitingRecovery =
        VALID_ER_RUN_STATUSES.includes(runStatus) &&
        runStatus !== RUN_STATUS_STOP_REQUESTED

      if (isAwaitingRecovery && !hasSeenAwaitingRecovery) {
        setHasSeenAwaitingRecovery(true)
      } else if (INVALID_ER_RUN_STATUSES.includes(runStatus)) {
        setHasSeenAwaitingRecovery(false)
      }
    }
  }, [runStatus, hasSeenAwaitingRecovery])

  // Manage isERActive state, the condition that actually renders Error Recovery.
  useEffect(() => {
    const shouldBeActive =
      isValidERStatus(runStatus) &&
      // The failedCommand is null when a stop is requested, but we still want to persist Error Recovery in specific circumstances.
      (failedCommand !== null || runStatus === RUN_STATUS_STOP_REQUESTED)

    if (shouldBeActive !== isERActive) {
      setIsERActive(shouldBeActive)
    }
  }, [runStatus, failedCommand, hasSeenAwaitingRecovery, isERActive])

  return {
    isERActive,
    failedCommand,
  }
}

export interface ErrorRecoveryFlowsProps {
  runId: string
  runStatus: RunStatus | null
  /* In some parts of Error Recovery, such as "retry failed command" during a generic error flow, we want to utilize
   * information derived from the failed command from the run record even if there is no matching command in protocol analysis.
   * Using a failed command that is not matched to a protocol analysis command is unsafe in most circumstances (ie, in
   * non-generic recovery flows. Prefer using failedCommandBySource in most circumstances. */
  unvalidatedFailedCommand: FailedCommand | null
  protocolAnalysis: CompletedProtocolAnalysis | null
}

export function ErrorRecoveryFlows(
  props: ErrorRecoveryFlowsProps
): JSX.Element | null {
  const { protocolAnalysis, runStatus, unvalidatedFailedCommand } = props

  const failedCommandBySource = useRetainedFailedCommandBySource(
    unvalidatedFailedCommand,
    protocolAnalysis
  )

  const { hasLaunchedRecovery, toggleERWizard, showERWizard } = useERWizard()
  const isOnDevice = useSelector(getIsOnDevice)
  const robotType = protocolAnalysis?.robotType ?? OT2_ROBOT_TYPE
  const robotName = useHost()?.robotName ?? 'robot'

  const isValidRobotSideAnalysis = protocolAnalysis != null

  // TODO(jh, 10-22-24): EXEC-769.
  const labwareDefinitionsByUri = useMemo(
    () =>
      protocolAnalysis != null
        ? getLoadedLabwareDefinitionsByUri(protocolAnalysis?.commands)
        : null,
    [isValidRobotSideAnalysis]
  )
  const allRunDefs =
    labwareDefinitionsByUri != null
      ? Object.values(labwareDefinitionsByUri)
      : []

  const {
    showTakeover,
    isActiveUser,
    intent,
    toggleERWizAsActiveUser,
  } = useRecoveryTakeover(toggleERWizard)

  const recoveryUtils = useERUtils({
    ...props,
    hasLaunchedRecovery,
    toggleERWizAsActiveUser,
    isOnDevice,
    robotType,
    isActiveUser,
    failedCommand: failedCommandBySource,
    allRunDefs,
    labwareDefinitionsByUri,
  })

  const renderWizard =
    isActiveUser &&
    (showERWizard || recoveryUtils.doorStatusUtils.isProhibitedDoorOpen)
  const showSplash = useRecoverySplash(isOnDevice, renderWizard as boolean)

  return (
    <>
      {showTakeover ? (
        <RecoveryTakeover
          intent={intent}
          robotName={robotName}
          isOnDevice={isOnDevice}
          runStatus={runStatus}
        />
      ) : null}
      {renderWizard ? (
        <ErrorRecoveryWizard
          {...props}
          {...recoveryUtils}
          robotType={robotType}
          isOnDevice={isOnDevice}
          failedCommand={failedCommandBySource}
          allRunDefs={allRunDefs}
        />
      ) : null}
      {showSplash ? (
        <RecoverySplash
          {...props}
          {...recoveryUtils}
          robotType={robotType}
          robotName={robotName}
          isOnDevice={isOnDevice}
          toggleERWizAsActiveUser={toggleERWizAsActiveUser}
          failedCommand={failedCommandBySource}
          resumePausedRecovery={!renderWizard && !showTakeover}
          allRunDefs={allRunDefs}
        />
      ) : null}
    </>
  )
}
