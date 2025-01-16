import type { LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'
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

export interface StepsInfo {
  currentStepIndex: number
  totalStepCount: number
  current: LabwarePositionCheckStep
  next: LabwarePositionCheckStep | null
  all: LabwarePositionCheckStep[]
}

export type LPCWizardAction =
  | InitialPositionAction
  | FinalPositionAction
  | ProceedStepAction
