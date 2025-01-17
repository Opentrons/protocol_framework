import * as Constants from '../constants'
import { LPCReducer } from './lpc'

import type { Reducer } from 'redux'

import type { Action } from '../../types'
import type { ProtocolRunState } from '../types'

import { setupReducer } from './setup'

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
          setup: setupReducer(currentRunState?.setup, action),
        },
      }
    }

    case Constants.START_LPC: {
      const runId = action.payload.runId
      const lpcState = action.payload.state
      const currentRunState = state[runId]

      if (currentRunState != null && currentRunState.lpc == null) {
        return {
          ...state,
          [runId]: {
            ...currentRunState,
            lpc: lpcState,
          },
        }
      } else {
        return state
      }
    }
    case Constants.FINISH_LPC:
    case Constants.PROCEED_STEP:
    case Constants.SET_INITIAL_POSITION:
    case Constants.SET_FINAL_POSITION: {
      const runId = action.payload.runId
      const currentRunState = state[runId]

      if (currentRunState?.lpc == null) {
        return state
      }

      return {
        ...state,
        [runId]: {
          ...currentRunState,
          lpc: LPCReducer(currentRunState.lpc, action),
        },
      }
    }

    default:
      return state
  }
}
