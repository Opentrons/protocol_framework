import { useState } from 'react'

import { useApplyLPCOffsets } from './useApplyLPCOffsets'
import { useHandleJog } from './useHandleJog'
import { useHandleConditionalCleanup } from './useHandleConditionalCleanup'
import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'
import { useHandleProbeCommands } from './useHandleProbeCommands'
import { useHandleStartLPC } from './useHandleStartLPC'
import { useHandlePrepModules } from './useHandlePrepModules'
import { useHandleConfirmLwModulePlacement } from './useHandleConfirmLwModulePlacement'
import { useHandleConfirmLwFinalPosition } from './useHandleConfirmLwFinalPosition'
import { useHandleResetLwModulesOnDeck } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/useHandleResetLwModulesOnDeck'

import type { CreateCommand } from '@opentrons/shared-data'
import type { CommandData } from '@opentrons/api-client'
import type { UseProbeCommandsResult } from './useHandleProbeCommands'
import type { UseHandleConditionalCleanupResult } from './useHandleConditionalCleanup'
import type { UseHandleJogResult } from './useHandleJog'
import type { UseApplyLPCOffsetsResult } from './useApplyLPCOffsets'
import type { UseHandleStartLPCResult } from './useHandleStartLPC'
import type { UseHandlePrepModulesResult } from './useHandlePrepModules'
import type { UseHandleConfirmPlacementResult } from './useHandleConfirmLwModulePlacement'
import type { UseHandleConfirmPositionResult } from './useHandleConfirmLwFinalPosition'
import type { UseHandleResetLwModulesOnDeckResult } from './useHandleResetLwModulesOnDeck'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'
import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'

export interface UseLPCCommandsProps extends LPCWizardFlexProps {
  state: LPCWizardState
}

export type UseLPCCommandsResult = UseApplyLPCOffsetsResult &
  UseHandleJogResult &
  UseHandleConditionalCleanupResult &
  UseProbeCommandsResult &
  UseHandleStartLPCResult &
  UseHandlePrepModulesResult &
  UseHandleConfirmPlacementResult &
  UseHandleConfirmPositionResult &
  UseHandleResetLwModulesOnDeckResult & {
    errorMessage: string | null
    isRobotMoving: boolean
  }

// Consolidates all command handlers and handler state for injection into LPC.
export function useLPCCommands(
  props: UseLPCCommandsProps
): UseLPCCommandsResult {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    chainRunCommands,
    isCommandMutationLoading: isRobotMoving,
  } = useChainMaintenanceCommands()

  const chainLPCCommands = (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ): Promise<CommandData[]> =>
    chainRunCommands(
      props.maintenanceRunId,
      commands,
      continuePastCommandFailure
    ).catch((e: Error) => {
      setErrorMessage(`Error during LPC command: ${e.message}`)
      return Promise.resolve([])
    })

  const applyLPCOffsetsUtils = useApplyLPCOffsets(props)
  const handleJogUtils = useHandleJog({ ...props, setErrorMessage })
  const handleConditionalCleanupUtils = useHandleConditionalCleanup(props)
  const handleProbeCommands = useHandleProbeCommands({
    ...props,
    chainLPCCommands,
  })
  const handleStartLPC = useHandleStartLPC({ ...props, chainLPCCommands })
  const handlePrepModules = useHandlePrepModules({ ...props, chainLPCCommands })
  const handleConfirmLwModulePlacement = useHandleConfirmLwModulePlacement({
    ...props,
    chainLPCCommands,
    setErrorMessage,
  })
  const handleConfirmLwFinalPosition = useHandleConfirmLwFinalPosition({
    ...props,
    chainLPCCommands,
    setErrorMessage,
  })
  const handleResetLwModulesOnDeck = useHandleResetLwModulesOnDeck({
    ...props,
    chainLPCCommands,
  })

  return {
    errorMessage,
    isRobotMoving,
    ...applyLPCOffsetsUtils,
    ...handleJogUtils,
    ...handleConditionalCleanupUtils,
    ...handleProbeCommands,
    ...handleStartLPC,
    ...handlePrepModules,
    ...handleConfirmLwModulePlacement,
    ...handleConfirmLwFinalPosition,
    ...handleResetLwModulesOnDeck,
  }
}
