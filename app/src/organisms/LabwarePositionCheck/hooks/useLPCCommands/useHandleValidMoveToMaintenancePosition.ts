import { moveToMaintenancePosition } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/commands'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'

import type { CommandData } from '@opentrons/api-client'
import type { LoadedPipette } from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'
import type { UseLPCCommandWithChainRunChildProps } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/types'

export interface UseHandleValidMoveToMaintenancePositionResult {
  /* Only move to maintenance position during probe steps. */
  handleValidMoveToMaintenancePosition: (
    pipette: LoadedPipette | null,
    step: LabwarePositionCheckStep | null
  ) => Promise<CommandData[]>
}

export function useHandleValidMoveToMaintenancePosition({
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandleValidMoveToMaintenancePositionResult {
  return {
    handleValidMoveToMaintenancePosition: (
      pipette: LoadedPipette | null,
      step: LabwarePositionCheckStep | null
    ): Promise<CommandData[]> => {
      if (
        step?.section === NAV_STEPS.ATTACH_PROBE ||
        step?.section === NAV_STEPS.DETACH_PROBE
      ) {
        return chainLPCCommands(moveToMaintenancePosition(pipette), false)
      } else {
        return Promise.reject(
          new Error(
            `Does not move to maintenance position if step is not a probe step. Step: ${step?.section}`
          )
        )
      }
    },
  }
}
