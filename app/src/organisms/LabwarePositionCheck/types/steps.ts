import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type { NAV_STEPS } from '../constants'
import type { LPCWizardContentProps } from './content'

export type LabwarePositionCheckStep =
  | BeforeBeginningStep
  | CheckTipRacksStep
  | AttachProbeStep
  | PickUpTipStep
  | CheckLabwareStep
  | CheckPositionsStep
  | ReturnTipStep
  | DetachProbeStep
  | ResultsSummaryStep

export type LPCStepProps<T extends LabwarePositionCheckStep> = Omit<
  LPCWizardContentProps,
  'step'
> & {
  step: Extract<LabwarePositionCheckStep, T>
}

export interface PerformLPCStep {
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  definitionUri: string
  adapterId?: string
  moduleId?: string
}

// TOME TODO: This all should be in redux.

export interface BeforeBeginningStep {
  section: typeof NAV_STEPS.BEFORE_BEGINNING
}

export interface AttachProbeStep {
  section: typeof NAV_STEPS.ATTACH_PROBE
  pipetteId: string
}

export interface CheckTipRacksStep extends PerformLPCStep {
  section: typeof NAV_STEPS.CHECK_TIP_RACKS
}

export interface CheckPositionsStep extends PerformLPCStep {
  section: typeof NAV_STEPS.CHECK_POSITIONS
}

export interface CheckLabwareStep extends PerformLPCStep {
  section: typeof NAV_STEPS.CHECK_LABWARE
}

export interface PickUpTipStep extends PerformLPCStep {
  section: typeof NAV_STEPS.PICK_UP_TIP
}

export interface ReturnTipStep extends PerformLPCStep {
  section: typeof NAV_STEPS.RETURN_TIP
}

export interface DetachProbeStep {
  section: typeof NAV_STEPS.DETACH_PROBE
  pipetteId: string
}

export interface ResultsSummaryStep {
  section: typeof NAV_STEPS.RESULTS_SUMMARY
}
