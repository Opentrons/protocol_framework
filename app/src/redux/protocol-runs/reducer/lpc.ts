import {
  PROCEED_STEP,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  FINISH_LPC,
} from '../constants'
import { updateWorkingOffset } from './transforms'

import type { LPCWizardAction, LPCWizardState } from '../types'

// TODO(jh, 01-17-25): A lot of this state should live above the LPC slice, in the general protocolRuns slice instead.
export function LPCReducer(
  state: LPCWizardState,
  action: LPCWizardAction
): LPCWizardState | undefined {
  switch (action.type) {
    case PROCEED_STEP: {
      const { currentStepIndex, totalStepCount } = state.steps
      const newStepIdx =
        currentStepIndex + 1 < totalStepCount
          ? currentStepIndex + 1
          : currentStepIndex

      const nextStepIdx =
        newStepIdx + 1 < totalStepCount ? newStepIdx + 1 : null
      const nextStep = nextStepIdx != null ? state.steps.all[nextStepIdx] : null

      return {
        ...state,
        steps: {
          ...state.steps,
          currentStepIndex: newStepIdx,
          current: state.steps.all[newStepIdx],
          next: nextStep,
        },
      }
    }

    case SET_INITIAL_POSITION:
    case SET_FINAL_POSITION:
      return {
        ...state,
        workingOffsets: updateWorkingOffset(state.workingOffsets, action),
      }

    case FINISH_LPC:
      return undefined

    default:
      return state
  }
}
