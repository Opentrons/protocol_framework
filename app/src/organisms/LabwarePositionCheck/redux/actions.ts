import {
  PROCEED_STEP,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  SET_TIP_PICKUP_OFFSET,
} from './constants'

import type { Coordinates } from '@opentrons/shared-data'
import type {
  ProceedStepAction,
  InitialPositionAction,
  FinalPositionAction,
  TipPickUpOffsetAction,
  PositionParams,
} from './types'

export const proceedStep = (): ProceedStepAction => ({
  type: PROCEED_STEP,
  payload: {},
})

// TOME TODO: I think you should be using this somewhere...
export const setTipPickupOffset = (
  offset: Coordinates | null
): TipPickUpOffsetAction => ({
  type: SET_TIP_PICKUP_OFFSET,
  payload: { offset },
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
