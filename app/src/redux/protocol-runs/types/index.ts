import type { RunSetupStatus } from './setup'

export * from './setup'

export interface PerRunUIState {
  setup: RunSetupStatus
}

export type ProtocolRunState = Partial<{
  readonly [runId: string]: PerRunUIState
}>
