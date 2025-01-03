import type { Coordinates } from '@opentrons/shared-data'
import type { LabwareOffsetLocation, VectorOffset } from '@opentrons/api-client'

interface WorkingOffset {
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

export interface LPCWizardState {
  workingOffsets: WorkingOffset[]
  tipPickUpOffset: Coordinates | null
}

export type LPCWizardAction =
  | InitialPositionAction
  | FinalPositionAction
  | TipPickUpOffsetAction
