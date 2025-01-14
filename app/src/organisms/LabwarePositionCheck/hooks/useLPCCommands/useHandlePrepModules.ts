import { modulePrepCommands } from './commands'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'
import { selectActiveLwInitialPosition } from '/app/organisms/LabwarePositionCheck/redux'

import type { CreateCommand } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'

export interface UseHandlePrepModulesResult {
  handleCheckItemsPrepModules: (step: LabwarePositionCheckStep | null) => void
}

// Prep module(s) before LPCing a specific labware involving module(s).
export function useHandlePrepModules({
  chainLPCCommands,
  state,
}: UseLPCCommandWithChainRunChildProps): UseHandlePrepModulesResult {
  const handleCheckItemsPrepModules = (
    step: LabwarePositionCheckStep | null
  ): void => {
    const initialPosition = selectActiveLwInitialPosition(step, state)

    if (step?.section === NAV_STEPS.CHECK_POSITIONS) {
      const prepCommands: CreateCommand[] = modulePrepCommands({
        step,
      })

      if (
        initialPosition == null &&
        // Only run these commands during the appropriate step.
        step.section === NAV_STEPS.CHECK_POSITIONS &&
        prepCommands.length > 0
      ) {
        void chainLPCCommands(prepCommands, false)
      }
    } else {
      console.warn('Cannot prep modules during unsupported step.')
    }
  }

  return { handleCheckItemsPrepModules }
}
