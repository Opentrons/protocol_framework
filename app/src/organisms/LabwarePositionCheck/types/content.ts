import type { Dispatch } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'
import type {
  LPCWizardAction,
  LPCWizardState,
} from '/app/organisms/LabwarePositionCheck/redux'
import type { LabwarePositionCheckStep } from './steps'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck'
import type { UseLPCCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks'

// TOME TODO: REDUX! Pretty much all of this should be in redux or in the data layer.

export type LPCWizardContentProps = Omit<LPCFlowsProps, 'robotType'> & {
  step: LabwarePositionCheckStep
  protocolName: string
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  dispatch: Dispatch<LPCWizardAction>
  state: LPCWizardState
  // TOME TODO: Consider adding the commands state to the state state.
  commandUtils: UseLPCCommandsResult
  currentStepIndex: number
  totalStepCount: number
  existingOffsets: LabwareOffset[]
  isOnDevice: boolean
  labwareDefs: LabwareDefinition2[]
}
