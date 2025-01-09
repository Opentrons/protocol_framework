import { useSelector } from 'react-redux'

import { getIsOnDevice } from '/app/redux/config'
import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { getLPCSteps } from './utils'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'

export interface UseLPCInitialStateProps extends LPCWizardFlexProps {}

export function useLPCInitialState(
  props: UseLPCInitialStateProps
): LPCWizardState {
  const { mostRecentAnalysis } = props
  const isOnDevice = useSelector(getIsOnDevice)

  const protocolCommands: RunTimeCommand[] = mostRecentAnalysis.commands
  const labwareDefs = getLabwareDefinitionsFromCommands(protocolCommands)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const LPCSteps = getLPCSteps({
    protocolData: mostRecentAnalysis,
    labwareDefs,
  })

  return {
    ...props,
    protocolData: props.mostRecentAnalysis,
    isOnDevice,
    labwareDefs,
    workingOffsets: [],
    tipPickUpOffset: null,
    deckConfig,
    steps: {
      currentStepIndex: 0,
      totalStepCount: LPCSteps.length - 1,
      current: LPCSteps[0],
      all: LPCSteps,
    },
  }
}
