import type {
  LPCStep,
  LPCWizardState,
  OffsetLocationDetails,
  PositionParams,
} from '/app/redux/protocol-runs/types/lpc'

type LabwareURI = string

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
  payload: { runId: string; toStep?: LPCStep }
}

export interface GoBackStepAction {
  type: 'GO_BACK_LAST_STEP'
  payload: { runId: string }
}

export interface SelectedLabwareNameAction {
  type: 'SET_SELECTED_LABWARE_URI'
  payload: {
    runId: string
    labwareUri: LabwareURI
  }
}

export interface SelectedLabwareAction {
  type: 'SET_SELECTED_LABWARE'
  payload: {
    runId: string
    labwareUri: LabwareURI
    location: OffsetLocationDetails | null
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

export interface ApplyOffsetAction {
  type: 'APPLY_OFFSET'
  payload: { runId: string; labwareUri: LabwareURI }
}

export type LPCWizardAction =
  | StartLPCAction
  | FinishLPCAction
  | SelectedLabwareNameAction
  | SelectedLabwareAction
  | ClearSelectedLabwareAction
  | InitialPositionAction
  | FinalPositionAction
  | ApplyOffsetAction
  | ProceedStepAction
  | GoBackStepAction
