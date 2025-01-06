import type { Dispatch } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type {
  LabwareOffset,
  LabwareOffsetCreateData,
} from '@opentrons/api-client'
import type { Jog } from '/app/molecules/JogControls/types'
import type { useChainRunCommands } from '/app/resources/runs'
import type {
  LPCWizardAction,
  LPCWizardState,
} from '/app/organisms/LabwarePositionCheck/redux'
import type { LabwarePositionCheckStep } from './steps'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck'

// TOME TODO: REDUX! Pretty much all of this should be in redux or in the data layer.

export interface LPCWizardContentProps
  extends Omit<LPCFlowsProps, 'robotType'> {
  step: LabwarePositionCheckStep
  protocolName: string
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  dispatch: Dispatch<LPCWizardAction>
  state: LPCWizardState
  currentStepIndex: number
  totalStepCount: number
  showConfirmation: boolean
  isExiting: boolean
  confirmExitLPC: () => void
  cancelExitLPC: () => void
  chainRunCommands: ReturnType<typeof useChainRunCommands>['chainRunCommands']
  errorMessage: string | null
  setErrorMessage: (errorMessage: string) => void
  existingOffsets: LabwareOffset[]
  handleJog: Jog
  isRobotMoving: boolean
  isOnDevice: boolean
  protocolHasModules: boolean
  handleApplyOffsets: (offsets: LabwareOffsetCreateData[]) => void
  isApplyingOffsets: boolean
}

export interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}
