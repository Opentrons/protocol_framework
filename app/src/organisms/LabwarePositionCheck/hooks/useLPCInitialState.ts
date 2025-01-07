import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'

export function useLPCInitialState(): LPCWizardState {
  return {
    workingOffsets: [],
    tipPickUpOffset: null,
  }
}
