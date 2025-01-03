import { updateWorkingOffset } from './transforms'
import {
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  SET_TIP_PICKUP_OFFSET,
} from './constants'

import type { LPCWizardAction } from './types'
import type { LPCWizardState } from '.'

export function LPCReducer(
  state: LPCWizardState,
  action: LPCWizardAction
): LPCWizardState {
  switch (action.type) {
    case SET_TIP_PICKUP_OFFSET:
      return { ...state, tipPickUpOffset: action.payload.offset }

    case SET_INITIAL_POSITION:
    case SET_FINAL_POSITION:
      return {
        ...state,
        workingOffsets: updateWorkingOffset(state.workingOffsets, action),
      }

    default:
      return state
  }
}
