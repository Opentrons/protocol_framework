// TOME TODO: I think you could reconsider naming this to something like useLPCState
//  by the time you finish this. IDK yet. It might make more sense to inject the state
//  and the dispatch into the wizard and have some sort of useInitialLPCState hook.

import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'

export function useLPCInitialState(): LPCWizardState {
  return {
    workingOffsets: [],
    tipPickUpOffset: null,
  }
}
