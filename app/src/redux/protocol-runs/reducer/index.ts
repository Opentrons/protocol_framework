import * as Constants from '../constants'

import type { Reducer } from 'redux'

import type { Action } from '../../types'
import type { ProtocolRunState } from '../types'

import { setup } from './setup'

const INITIAL_STATE: ProtocolRunState = {}

export const protocolRunReducer: Reducer<ProtocolRunState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.UPDATE_RUN_SETUP_STEPS_COMPLETE:
    case Constants.UPDATE_RUN_SETUP_STEPS_REQUIRED: {
      const runId = action.payload.runId
      const currentRunState = state[runId]

      return {
        ...state,
        [runId]: {
          ...currentRunState,
          setup: setup(currentRunState?.setup, action),
        },
      }
    }
    default:
      return state
  }
}
