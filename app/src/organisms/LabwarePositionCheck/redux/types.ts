import type {
  Coordinates,
  DeckConfiguration,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'

export interface WorkingOffset {
  labwareId: string
  location: LabwareOffsetLocation
  initialPosition: VectorOffset | null
  finalPosition: VectorOffset | null
}

export interface PositionParams {
  labwareId: string
  location: LabwareOffsetLocation
  position: VectorOffset | null
}

export interface ProceedStepAction {
  type: 'PROCEED_STEP'
  payload: Record<never, never>
}

export interface InitialPositionAction {
  type: 'SET_INITIAL_POSITION'
  payload: PositionParams
}

export interface FinalPositionAction {
  type: 'SET_FINAL_POSITION'
  payload: PositionParams
}

export interface TipPickUpOffsetAction {
  type: 'SET_TIP_PICKUP_OFFSET'
  payload: {
    offset: Coordinates | null
  }
}

interface StepsInfo {
  currentStepIndex: number
  totalStepCount: number
  current: LabwarePositionCheckStep
  all: LabwarePositionCheckStep[]
}

export interface LPCWizardState extends LPCWizardFlexProps {
  isOnDevice: boolean
  workingOffsets: WorkingOffset[]
  tipPickUpOffset: Coordinates | null
  protocolData: LPCWizardFlexProps['mostRecentAnalysis']
  labwareDefs: LabwareDefinition2[]
  deckConfig: DeckConfiguration
  steps: StepsInfo
}

export type LPCWizardAction =
  | InitialPositionAction
  | FinalPositionAction
  | TipPickUpOffsetAction
  | ProceedStepAction
