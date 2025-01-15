import {
  fullHomeCommands,
  modulePrepCommands,
  moveLabwareOffDeckCommands,
} from './commands'

import type { CreateCommand } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type {
  BuildMoveLabwareOffDeckParams,
  BuildModulePrepCommandsParams,
} from './commands'

export interface UseHandleResetLwModulesOnDeckResult {
  handleResetLwModulesOnDeck: (
    params: BuildModulePrepCommandsParams & BuildMoveLabwareOffDeckParams
  ) => Promise<void>
}

export function useHandleResetLwModulesOnDeck({
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandleResetLwModulesOnDeckResult {
  const handleResetLwModulesOnDeck = (
    params: BuildModulePrepCommandsParams & BuildMoveLabwareOffDeckParams
  ): Promise<void> => {
    const resetCommands: CreateCommand[] = [
      ...modulePrepCommands(params),
      ...fullHomeCommands(),
      ...moveLabwareOffDeckCommands(params as BuildMoveLabwareOffDeckParams),
    ]

    return chainLPCCommands(resetCommands, false).then(() => Promise.resolve())
  }

  return { handleResetLwModulesOnDeck }
}
