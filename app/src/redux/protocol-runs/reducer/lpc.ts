import {
  PROCEED_STEP,
  SET_SELECTED_LABWARE,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  FINISH_LPC,
  START_LPC,
  GO_BACK_STEP,
} from '../constants'
import { updateOffsetsForURI } from './transforms'

import type {
  LPCWizardAction,
  LPCWizardState,
  SelectedLabwareInfo,
} from '../types'

// TODO(jh, 01-17-25): A lot of this state should live above the LPC slice, in the general protocolRuns slice instead.
//  We should make selectors for that state, too!
export function LPCReducer(
  state: LPCWizardState | undefined,
  action: LPCWizardAction
): LPCWizardState | undefined {
  if (action.type === START_LPC) {
    return action.payload.state
  } else if (state == null) {
    return undefined
  } else {
    switch (action.type) {
      case PROCEED_STEP: {
        const { currentStepIndex, totalStepCount } = state.steps
        const newStepIdx =
          currentStepIndex + 1 < totalStepCount
            ? currentStepIndex + 1
            : currentStepIndex

        return {
          ...state,
          steps: {
            ...state.steps,
            currentStepIndex: newStepIdx,
          },
        }
      }

      case GO_BACK_STEP: {
        const { currentStepIndex } = state.steps
        const newStepIdx = currentStepIndex > 0 ? currentStepIndex - 1 : 0

        return {
          ...state,
          steps: {
            ...state.steps,
            currentStepIndex: newStepIdx,
          },
        }
      }

      case SET_SELECTED_LABWARE: {
        const lwUri = action.payload.labwareUri
        const thisLwInfo = state.labwareInfo.labware[lwUri]

        const selectedLabware: SelectedLabwareInfo = {
          uri: action.payload.labwareUri,
          id: thisLwInfo.id,
          locationDetails: action.payload.location,
        }

        return {
          ...state,
          labwareInfo: {
            ...state.labwareInfo,
            selectedLabware,
          },
        }
      }

      case SET_INITIAL_POSITION:
      case SET_FINAL_POSITION: {
        const lwUri = action.payload.labwareUri

        return {
          ...state,
          labwareInfo: {
            ...state.labwareInfo,
            labware: {
              ...state.labwareInfo.labware,
              [lwUri]: {
                ...state.labwareInfo.labware[lwUri],
                offsetDetails: updateOffsetsForURI(state, action),
              },
            },
          },
        }
      }

      case FINISH_LPC:
        return undefined

      default:
        return state
    }
  }
}
