import { useMostRecentCompletedAnalysis } from '/app/resources/runs'

import { useLastRunProtocolCommand } from './useLastRunProtocolCommand'

import type { CommandsData } from '@opentrons/api-client'
import { getRunningStepCountsFrom } from '/app/resources/protocols'

export interface StepCounts {
  /* Excludes "fixit" commands. Returns null if the step is not found. */
  currentStepNumber: number | null
  /* Returns null if the run has diverged or the total command count is not found. */
  totalStepCount: number | null
  /* Returns whether the run has diverged from analysis. */
  hasRunDiverged: boolean
}

/**
 * Find the index of the analysis command within the analysis
 * that has the same commandKey as the most recent
 * command from the run record.
 * In the case of a non-deterministic protocol,
 * return null for the current and total steps.
 * NOTE: The most recent
 * command may not always be "current", for instance if
 * the run has completed/failed.
 * NOTE #2: "Fixit" commands are excluded from the step count.
 * */
export function useRunningStepCounts(
  runId: string,
  commandsData: CommandsData | undefined
): StepCounts {
  const analysis = useMostRecentCompletedAnalysis(runId)
  const analysisCommands = analysis?.commands ?? []
  const lastRunCommandNoFixit = useLastRunProtocolCommand(
    runId,
    commandsData ?? null
  )

  return getRunningStepCountsFrom(analysisCommands, lastRunCommandNoFixit)
}
