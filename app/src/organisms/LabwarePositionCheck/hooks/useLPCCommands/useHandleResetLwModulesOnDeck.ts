import { buildModulePrepCommands, buildMoveLabwareOffDeck } from './helpers'

import type { UseLPCCommandWithChainRunChildProps } from './types'
import type {
  BuildMoveLabwareOffDeckParams,
  BuildModulePrepCommandsParams,
} from './helpers'

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
  ): Promise<void> =>
    chainLPCCommands(
      [
        ...buildModulePrepCommands(params),
        { commandType: 'home', params: {} },
        ...buildMoveLabwareOffDeck(params),
      ],
      false
    ).then(() => Promise.resolve())

  return { handleResetLwModulesOnDeck }
}
