import {
  PROCEED_STEP,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
} from './constants'

import type {
  ProceedStepAction,
  InitialPositionAction,
  FinalPositionAction,
  PositionParams,
} from './types'

export const proceedStep = (): ProceedStepAction => ({
  type: PROCEED_STEP,
  payload: {},
})
export const setInitialPosition = (
  params: PositionParams
): InitialPositionAction => ({
  type: SET_INITIAL_POSITION,
  payload: params,
})

export const setFinalPosition = (
  params: PositionParams
): FinalPositionAction => ({
  type: SET_FINAL_POSITION,
  payload: params,
})
