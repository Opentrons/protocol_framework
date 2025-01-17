import {
  PROCEED_STEP,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  START_LPC,
  FINISH_LPC,
} from '../constants'

import type {
  FinalPositionAction,
  InitialPositionAction,
  StartLPCAction,
  LPCWizardState,
  PositionParams,
  ProceedStepAction,
  FinishLPCAction,
} from '../types'

export const proceedStep = (runId: string): ProceedStepAction => ({
  type: PROCEED_STEP,
  payload: { runId },
})
export const setInitialPosition = (
  runId: string,
  params: PositionParams
): InitialPositionAction => ({
  type: SET_INITIAL_POSITION,
  payload: { ...params, runId },
})

export const setFinalPosition = (
  runId: string,
  params: PositionParams
): FinalPositionAction => ({
  type: SET_FINAL_POSITION,
  payload: { ...params, runId },
})

export const startLPC = (
  runId: string,
  state: LPCWizardState
): StartLPCAction => ({
  type: START_LPC,
  payload: { runId, state },
})

export const closeLPC = (runId: string): FinishLPCAction => ({
  type: FINISH_LPC,
  payload: { runId },
})
