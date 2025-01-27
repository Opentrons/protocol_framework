import type {
  DeckConfiguration,
  ModuleModel,
  LabwareDefinition2,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import type { VectorOffset } from '@opentrons/api-client'
import type { LPC_STEP } from '/app/redux/protocol-runs'

type LabwareURI = string
type LabwareId = string

export type LPCStep = keyof typeof LPC_STEP

export interface StepInfo {
  currentStepIndex: number
  totalStepCount: number
  all: LPCStep[]
}

export interface ExistingOffset {
  createdAt: string
  vector: VectorOffset
}

export interface WorkingOffset {
  initialPosition: VectorOffset | null
  finalPosition: VectorOffset | null
}

export interface PositionParams {
  labwareUri: string
  location: LPCLabwareLocationDetails
  position: VectorOffset | null
}

export interface LPCLabwareLocationDetails {
  labwareId: string
  definitionUri: string
  slotName: string
  moduleModel?: ModuleModel
  moduleId?: string
  adapterId?: string
}

// TODO(jh, 01-23-25): Revisit working/existing/initialOffsets once API rework becomes more finalized.
export interface OffsetDetails {
  existingOffset: ExistingOffset
  workingOffset: WorkingOffset | null
  locationDetails: LPCLabwareLocationDetails
}

export interface LabwareDetails {
  id: LabwareId
  offsetDetails: OffsetDetails[]
}

export interface SelectedLabwareInfo {
  uri: LabwareURI
  id: LabwareId
  locationDetails: LPCLabwareLocationDetails
}

export interface LPCLabwareInfo {
  selectedLabware: SelectedLabwareInfo | null
  labware: Record<LabwareURI, LabwareDetails>
}

export interface LPCWizardState {
  steps: StepInfo
  activePipetteId: string
  labwareInfo: LPCLabwareInfo
  protocolData: CompletedProtocolAnalysis
  labwareDefs: LabwareDefinition2[]
  deckConfig: DeckConfiguration
  protocolName: string
  maintenanceRunId: string
}

export interface StartLPCAction {
  type: 'START_LPC'
  payload: { runId: string; state: LPCWizardState }
}

export interface FinishLPCAction {
  type: 'FINISH_LPC'
  payload: { runId: string }
}

export interface ProceedStepAction {
  type: 'PROCEED_STEP'
  payload: { runId: string }
}

export interface GoBackStepAction {
  type: 'GO_BACK_STEP'
  payload: { runId: string }
}

export interface SelectedLabwareAction {
  type: 'SET_SELECTED_LABWARE'
  payload: {
    runId: string
    labwareUri: LabwareURI
    location: LPCLabwareLocationDetails
  }
}

export interface ClearSelectedLabwareAction {
  type: 'CLEAR_SELECTED_LABWARE'
  payload: { runId: string }
}

export interface InitialPositionAction {
  type: 'SET_INITIAL_POSITION'
  payload: PositionParams & { runId: string }
}

export interface FinalPositionAction {
  type: 'SET_FINAL_POSITION'
  payload: PositionParams & { runId: string }
}

export type LPCWizardAction =
  | StartLPCAction
  | FinishLPCAction
  | SelectedLabwareAction
  | InitialPositionAction
  | FinalPositionAction
  | ProceedStepAction
  | GoBackStepAction
