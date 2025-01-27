import { useSelector } from 'react-redux'

import { modulePrepCommands } from './commands'
import { STEP } from '/app/organisms/LabwarePositionCheck/constants'
import { selectActiveLwInitialPosition } from '/app/redux/protocol-runs'

import type { CreateCommand } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'
import type { CommandData } from '@opentrons/api-client'
import type { State } from '/app/redux/types'

export interface UseHandlePrepModulesResult {
  handleCheckItemsPrepModules: (
    step: LabwarePositionCheckStep | null
  ) => Promise<CommandData[]>
}

// Prep module(s) before LPCing a specific labware involving module(s).
export function useHandlePrepModules({
  runId,
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseHandlePrepModulesResult {
  const selectInitialPositionFrom = useSelector(
    (state: State) => (step: LabwarePositionCheckStep | null) =>
      selectActiveLwInitialPosition(step, runId, state)
  )

  const handleCheckItemsPrepModules = (
    step: LabwarePositionCheckStep | null
  ): Promise<CommandData[]> => {
    const initialPosition = selectInitialPositionFrom(step)

    if (step?.section === STEP.CHECK_POSITIONS) {
      const prepCommands: CreateCommand[] = modulePrepCommands({
        step,
      })

      if (
        initialPosition == null &&
        // Only run these commands during the appropriate step.
        step.section === STEP.CHECK_POSITIONS &&
        prepCommands.length > 0
      ) {
        return chainLPCCommands(prepCommands, false)
      } else {
        return Promise.resolve([])
      }
    }

    return Promise.reject(
      new Error(`Cannot prep modules during unsupported step: ${step?.section}`)
    )
  }

  return { handleCheckItemsPrepModules }
}
