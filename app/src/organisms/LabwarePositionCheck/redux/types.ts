import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'

// TODO(jh, 01-16-25): Remove this once `steps` are refactored out of Redux.

export interface StepsInfo {
  currentStepIndex: number
  totalStepCount: number
  current: LabwarePositionCheckStep
  next: LabwarePositionCheckStep | null
  all: LabwarePositionCheckStep[]
}
