import type { RunCommandSummary } from '@opentrons/api-client'

// Whether the last run protocol command prompted Error Recovery.
export function lastRunCommandPromptedErrorRecovery(
  summary: RunCommandSummary[]
): boolean {
  const lastProtocolCommand = summary.findLast(
    command => command.intent !== 'fixit' && command.error != null
  )

  // All recoverable protocol commands have defined errors.
  return lastProtocolCommand?.error?.isDefined ?? false
}
