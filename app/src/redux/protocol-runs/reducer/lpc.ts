import {
  PROCEED_STEP,
  SET_SELECTED_LABWARE,
  SET_INITIAL_POSITION,
  SET_FINAL_POSITION,
  FINISH_LPC,
  START_LPC,
  GO_BACK_LAST_STEP,
  SET_SELECTED_LABWARE_URI,
  APPLY_WORKING_OFFSETS,
  LPC_STEPS,
  PROCEED_HANDLE_LW_SUBSTEP,
  GO_BACK_HANDLE_LW_SUBSTEP,
  HANDLE_LW_SUBSTEP,
  RESET_OFFSET_TO_DEFAULT,
  CLEAR_WORKING_OFFSETS,
} from '../constants'
import { updateOffsetsForURI } from './transforms'

import type {
  HandleLwSubstep,
  LPCWizardAction,
  LPCWizardState,
  SelectedLabwareWithOffsetInfo,
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

        const currentStepName = state.steps.all[newStepIdx()]

        return {
          ...state,
          steps: {
            ...state.steps,
            currentStepIndex: newStepIdx(),
            lastStepIndices: [...(lastStepIndices ?? []), currentStepIndex],
            currentSubstep:
              currentStepName === 'HANDLE_LABWARE'
                ? HANDLE_LW_SUBSTEP.LIST
                : null,
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

      case PROCEED_HANDLE_LW_SUBSTEP: {
        const currentSubstep = state.steps.currentSubstep
        const selectedLw = state.labwareInfo.selectedLabware

        const getNextSubStep = (): HandleLwSubstep | null => {
          switch (currentSubstep) {
            case null:
              return HANDLE_LW_SUBSTEP.LIST
            case HANDLE_LW_SUBSTEP.LIST:
              return HANDLE_LW_SUBSTEP.DETAILS
            case HANDLE_LW_SUBSTEP.DETAILS:
              return HANDLE_LW_SUBSTEP.EDIT_OFFSET_PREP_LW
            case HANDLE_LW_SUBSTEP.EDIT_OFFSET_PREP_LW:
              return HANDLE_LW_SUBSTEP.EDIT_OFFSET_CHECK_LW
            case HANDLE_LW_SUBSTEP.EDIT_OFFSET_CHECK_LW:
              return HANDLE_LW_SUBSTEP.DETAILS
          }
        }

        if (getNextSubStep() === HANDLE_LW_SUBSTEP.LIST) {
          return {
            ...state,
            labwareInfo: {
              ...state.labwareInfo,
              selectedLabware: null,
            },
            steps: { ...state.steps, currentSubstep: getNextSubStep() },
          }
        } else if (getNextSubStep() === HANDLE_LW_SUBSTEP.DETAILS) {
          if (selectedLw == null) {
            console.error('Cannot proceed substep if labware is not set.')
            return state
          } else {
            return {
              ...state,
              labwareInfo: {
                ...state.labwareInfo,
                selectedLabware: {
                  ...selectedLw,
                  offsetLocationDetails: null,
                },
              },
              steps: { ...state.steps, currentSubstep: getNextSubStep() },
            }
          }
        } else if (
          getNextSubStep() === HANDLE_LW_SUBSTEP.EDIT_OFFSET_CHECK_LW &&
          selectedLw?.offsetLocationDetails == null
        ) {
          console.error('Cannot proceed substep if details are not set.')
          return {
            ...state,
            steps: { ...state.steps, currentSubstep: getNextSubStep() },
          }
        } else {
          return {
            ...state,
            steps: { ...state.steps, currentSubstep: getNextSubStep() },
          }
        }
      }

      case GO_BACK_HANDLE_LW_SUBSTEP: {
        const currentSubstep = state.steps.currentSubstep

        const getPrevSubStep = (): HandleLwSubstep | null => {
          switch (currentSubstep) {
            case null:
              return HANDLE_LW_SUBSTEP.LIST
            case HANDLE_LW_SUBSTEP.LIST:
              return HANDLE_LW_SUBSTEP.LIST
            case HANDLE_LW_SUBSTEP.DETAILS:
              return HANDLE_LW_SUBSTEP.LIST
            case HANDLE_LW_SUBSTEP.EDIT_OFFSET_PREP_LW:
              return HANDLE_LW_SUBSTEP.DETAILS
            case HANDLE_LW_SUBSTEP.EDIT_OFFSET_CHECK_LW:
              return HANDLE_LW_SUBSTEP.EDIT_OFFSET_PREP_LW
          }
        }

        if (getPrevSubStep() === HANDLE_LW_SUBSTEP.LIST) {
          return {
            ...state,
            labwareInfo: {
              ...state.labwareInfo,
              selectedLabware: null,
            },
            steps: { ...state.steps, currentSubstep: getPrevSubStep() },
          }
        } else if (getPrevSubStep() === HANDLE_LW_SUBSTEP.DETAILS) {
          const selectedLw = state.labwareInfo.selectedLabware

          if (selectedLw == null) {
            console.error('Cannot go back substep if labware is not set.')
            return state
          } else {
            return {
              ...state,
              labwareInfo: {
                ...state.labwareInfo,
                selectedLabware: {
                  ...selectedLw,
                  offsetLocationDetails: null,
                },
              },
              steps: { ...state.steps, currentSubstep: getPrevSubStep() },
            }
          }
        } else {
          return {
            ...state,
            steps: { ...state.steps, currentSubstep: getPrevSubStep() },
          }
        }
      }

      case SET_SELECTED_LABWARE_URI: {
        const lwUri = action.payload.labwareUri
        const thisLwInfo = state.labwareInfo.labware[lwUri]

        const selectedLabware: SelectedLabwareWithOffsetInfo = {
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

        const selectedLabware: SelectedLabwareWithOffsetInfo = {
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

      case SET_INITIAL_POSITION:
      case SET_FINAL_POSITION:
      case CLEAR_WORKING_OFFSETS:
      case RESET_OFFSET_TO_DEFAULT:
      case APPLY_WORKING_OFFSETS: {
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

      case FINISH_LPC:
        return undefined

      default:
        return state
    }
  }
}
