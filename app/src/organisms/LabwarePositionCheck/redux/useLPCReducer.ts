import { useReducer } from 'react'

import { LPCReducer } from './reducer'

import type { Dispatch } from 'react'
import type { LPCWizardAction, LPCWizardState } from './types'

interface UseLPCReducerResult {
  state: LPCWizardState
  dispatch: Dispatch<LPCWizardAction>
}

export function useLPCReducer(
  initialState: LPCWizardState
): UseLPCReducerResult {
  const [state, dispatch] = useReducer(LPCReducer, initialState)

  return { state, dispatch }
}
