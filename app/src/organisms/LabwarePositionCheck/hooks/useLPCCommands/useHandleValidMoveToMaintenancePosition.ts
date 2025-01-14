import { moveToMaintenancePosition } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/commands'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'

import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'
import type { UseLPCCommandWithChainRunChildProps } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/types'

export interface UseHandleValidMoveToMaintenancePositionResult {
  /* Only move to maintenance position during probe steps. */
  handleValidMoveToMaintenancePosition: (
    step: LabwarePositionCheckStep | null
  ) => void
}

export function useHandleValidMoveToMaintenancePosition({
  state,
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandleValidMoveToMaintenancePositionResult {
  return {
    handleValidMoveToMaintenancePosition: (
      step: LabwarePositionCheckStep | null
    ) => {
      if (
        step?.section === NAV_STEPS.ATTACH_PROBE ||
        step?.section === NAV_STEPS.DETACH_PROBE
      ) {
        void chainLPCCommands(moveToMaintenancePosition(step, state), false)
      }
    },
  }
}
