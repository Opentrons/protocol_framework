import {
  PROCEED_STEP,
  SET_SELECTED_LABWARE,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  FINISH_LPC,
  START_LPC,
  GO_BACK_LAST_STEP,
  SET_SELECTED_LABWARE_URI,
  CLEAR_SELECTED_LABWARE,
  APPLY_OFFSET,
  LPC_STEPS,
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
        const {
          currentStepIndex,
          lastStepIndices,
          totalStepCount,
        } = state.steps
        const { toStep } = action.payload

        const newStepIdx = (): number => {
          if (toStep == null) {
            return currentStepIndex + 1 < totalStepCount
              ? currentStepIndex + 1
              : currentStepIndex
          } else {
            const newIdx = LPC_STEPS.findIndex(step => step === toStep)

            if (newIdx === -1) {
              console.error(`Unexpected routing to step: ${toStep}`)
              return 0
            } else {
              return newIdx
            }
          }
        }

        return {
          ...state,
          steps: {
            ...state.steps,
            currentStepIndex: newStepIdx(),
            lastStepIndices: [...(lastStepIndices ?? []), currentStepIndex],
          },
        }
      }

      case GO_BACK_LAST_STEP: {
        const { lastStepIndices } = state.steps
        const lastStep = lastStepIndices?.[lastStepIndices.length - 1] ?? 0

        return {
          ...state,
          steps: {
            ...state.steps,
            currentStepIndex: lastStep,
            lastStepIndices:
              lastStepIndices?.slice(0, lastStepIndices.length - 1) ?? null,
          },
        }
      }

      case SET_SELECTED_LABWARE_URI: {
        const lwUri = action.payload.labwareUri
        const thisLwInfo = state.labwareInfo.labware[lwUri]

        const selectedLabware: SelectedLabwareInfo = {
          uri: action.payload.labwareUri,
          id: thisLwInfo.id,
          offsetLocationDetails: null,
        }

        return {
          ...state,
          labwareInfo: {
            ...state.labwareInfo,
            selectedLabware,
          },
        }
      }

      case SET_SELECTED_LABWARE: {
        const lwUri = action.payload.labwareUri
        const thisLwInfo = state.labwareInfo.labware[lwUri]

        const selectedLabware: SelectedLabwareInfo = {
          uri: action.payload.labwareUri,
          id: thisLwInfo.id,
          offsetLocationDetails: action.payload.location,
        }

        return {
          ...state,
          labwareInfo: {
            ...state.labwareInfo,
            selectedLabware,
          },
        }
      }

      case CLEAR_SELECTED_LABWARE: {
        return {
          ...state,
          labwareInfo: {
            ...state.labwareInfo,
            selectedLabware: null,
          },
        }
      }

      case SET_INITIAL_POSITION:
      case SET_FINAL_POSITION: {
        const lwUri = action.payload.labwareUri
        const updatedLwDetails = updateOffsetsForURI(state, action)

        return {
          ...state,
          labwareInfo: {
            ...state.labwareInfo,
            labware: {
              ...state.labwareInfo.labware,
              [lwUri]: {
                ...state.labwareInfo.labware[lwUri],
                ...updatedLwDetails,
              },
            },
          },
        }
      }

      case APPLY_OFFSET: {
        // TODO(jh, 01-30-25): Update the existing offset in the store, and clear the
        //  the working offset state. This will break the legacy LPC "apply all offsets"
        //  functionality, so this must be implemented simultaneously with the API changes.
        break
      }

      case FINISH_LPC:
        return undefined

      default:
        return state
    }
  }
}
