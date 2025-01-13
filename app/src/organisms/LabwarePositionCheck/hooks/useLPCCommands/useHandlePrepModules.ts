import { modulePrepCommands } from './commands'

import type { VectorOffset } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { BuildModulePrepCommandsParams } from './commands'

interface HandlePrepModulesParams extends BuildModulePrepCommandsParams {
  initialPosition: VectorOffset | null
}

export interface UseHandlePrepModulesResult {
  handlePrepModules: (params: HandlePrepModulesParams) => void
}

// Prep module(s) before LPCing a specific labware involving module(s).
export function useHandlePrepModules({
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandlePrepModulesResult {
  const handlePrepModules = ({
    initialPosition,
    ...rest
  }: HandlePrepModulesParams): void => {
    const prepCommands: CreateCommand[] = modulePrepCommands(rest)

    if (initialPosition == null && prepCommands.length > 0) {
      void chainLPCCommands(prepCommands, false)
    }
  }

  return { handlePrepModules }
}
