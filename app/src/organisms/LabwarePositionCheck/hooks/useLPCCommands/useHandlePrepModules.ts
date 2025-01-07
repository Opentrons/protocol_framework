import { buildModulePrepCommands } from './helpers'

import type { VectorOffset } from '@opentrons/api-client'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { BuildModulePrepCommandsParams } from './helpers'

interface HandlePrepModulesParams extends BuildModulePrepCommandsParams {
  initialPosition: VectorOffset | undefined | null
}

export interface UseHandlePrepModulesResult {
  handlePrepModules: (params: HandlePrepModulesParams) => void
}

export function useHandlePrepModules({
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandlePrepModulesResult {
  const handlePrepModules = ({
    initialPosition,
    ...rest
  }: HandlePrepModulesParams): void => {
    const prepCmds = buildModulePrepCommands(rest)

    if (initialPosition == null && prepCmds.length > 0) {
      void chainLPCCommands(prepCmds, false)
    }
  }

  return { handlePrepModules }
}
