import { useDispatch } from 'react-redux'

import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { startLPC } from '/app/redux/protocol-runs'
import { getLPCSteps } from './utils'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LPCWizardState } from '/app/redux/protocol-runs'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'

export interface UseLPCInitialStateProps
  extends Omit<LPCWizardFlexProps, 'onCloseClick'> {}

// Inject initial LPC state into Redux.
export function useLPCInitialState({
  mostRecentAnalysis,
  runId,
  ...rest
}: UseLPCInitialStateProps): void {
  const dispatch = useDispatch()

  const protocolCommands: RunTimeCommand[] = mostRecentAnalysis.commands
  const labwareDefs = getLabwareDefinitionsFromCommands(protocolCommands)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const LPCSteps = getLPCSteps({
    protocolData: mostRecentAnalysis,
    labwareDefs,
  })

  const initialState: LPCWizardState = {
    ...rest,
    protocolData: mostRecentAnalysis,
    labwareDefs,
    workingOffsets: [],
    deckConfig,
    steps: {
      currentStepIndex: 0,
      totalStepCount: LPCSteps.length,
      current: LPCSteps[0],
      all: LPCSteps,
      next: LPCSteps[1],
    },
  }

  dispatch(startLPC(runId, initialState))
}
