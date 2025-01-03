import type { NAV_STEPS } from './constants'
import type { LabwareOffsetLocation } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

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
export interface BeforeBeginningStep {
  section: typeof NAV_STEPS.BEFORE_BEGINNING
}
export interface CheckTipRacksStep {
  section: typeof NAV_STEPS.CHECK_TIP_RACKS
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  definitionUri: string
  adapterId?: string
}
export interface AttachProbeStep {
  section: typeof NAV_STEPS.ATTACH_PROBE
  pipetteId: string
}
export interface PickUpTipStep {
  section: typeof NAV_STEPS.PICK_UP_TIP
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  definitionUri: string
  adapterId?: string
}
export interface CheckPositionsStep {
  section: typeof NAV_STEPS.CHECK_POSITIONS
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  definitionUri: string
  moduleId?: string
}
export interface CheckLabwareStep {
  section: typeof NAV_STEPS.CHECK_LABWARE
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  definitionUri: string
  moduleId?: string
  adapterId?: string
}
export interface ReturnTipStep {
  section: typeof NAV_STEPS.RETURN_TIP
  pipetteId: string
  labwareId: string
  location: LabwareOffsetLocation
  definitionUri: string
  adapterId?: string
}
export interface DetachProbeStep {
  section: typeof NAV_STEPS.DETACH_PROBE
  pipetteId: string
}
export interface ResultsSummaryStep {
  section: typeof NAV_STEPS.RESULTS_SUMMARY
}

export interface LabwareToOrder {
  definition: LabwareDefinition2
  labwareId: string
  slot: string
}
