import { updateWorkingOffset } from './transforms'
import {
  PROCEED_STEP,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
} from './constants'

import type { LPCWizardAction } from './types'
import type { LPCWizardState } from '.'

export function LPCReducer(
  state: LPCWizardState,
  action: LPCWizardAction
): LPCWizardState {
  switch (action.type) {
    case PROCEED_STEP: {
      const { currentStepIndex, totalStepCount } = state.steps
      const newStepIdx =
        currentStepIndex !== totalStepCount
          ? currentStepIndex + 1
          : currentStepIndex

      return {
        ...state,
        steps: {
          ...state.steps,
          currentStepIndex: newStepIdx,
          current: state.steps.all[newStepIdx],
        },
      }
    }

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
