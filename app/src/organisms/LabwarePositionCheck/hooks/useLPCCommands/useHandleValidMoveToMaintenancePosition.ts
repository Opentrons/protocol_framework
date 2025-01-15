import { moveToMaintenancePosition } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/commands'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'

import type { CommandData } from '@opentrons/api-client'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'
import type { UseLPCCommandWithChainRunChildProps } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/types'

export interface UseHandleValidMoveToMaintenancePositionResult {
  /* Only move to maintenance position during probe steps. */
  handleValidMoveToMaintenancePosition: (
    step: LabwarePositionCheckStep | null
  ) => Promise<CommandData[]>
}

export function useHandleValidMoveToMaintenancePosition({
  state,
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandleValidMoveToMaintenancePositionResult {
  return {
    handleValidMoveToMaintenancePosition: (
      step: LabwarePositionCheckStep | null
    ): Promise<CommandData[]> => {
      if (
        step?.section === NAV_STEPS.ATTACH_PROBE ||
        step?.section === NAV_STEPS.DETACH_PROBE
      ) {
        return chainLPCCommands(moveToMaintenancePosition(step, state), false)
      } else {
        return Promise.reject(
          new Error(
            'Does not move to maintenance position if step is not a probe step.'
          )
        )
      }
    },
  }
}
