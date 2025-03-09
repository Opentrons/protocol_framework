import { createSelector } from 'reselect'

import { LPC_STEP } from '/app/redux/protocol-runs'

import type { Selector } from 'reselect'
import type { State } from '../../../types'
import type { LPCStep, StepInfo, LPCSubstep } from '/app/redux/protocol-runs'

export const selectCurrentStep = (runId: string): Selector<State, LPCStep> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.steps.currentStepIndex,
    (state: State) => state.protocolRuns[runId]?.lpc?.steps.all,
    (currentIdx, allSteps) =>
      allSteps?.[currentIdx ?? 0] ?? LPC_STEP.BEFORE_BEGINNING
  )

export const selectCurrentSubstep = (
  runId: string
): Selector<State, LPCSubstep | null> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.steps.currentSubstep,
    substep => substep ?? null
  )

export const selectStepInfo = (runId: string): Selector<State, StepInfo> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.steps,
    stepInfo =>
      stepInfo ?? {
        currentStepIndex: 0,
        totalStepCount: 0,
        all: [],
        lastStepIndices: null,
        currentSubstep: null,
      }
  )
