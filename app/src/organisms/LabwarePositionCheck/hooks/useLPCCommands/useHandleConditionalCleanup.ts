import { useState } from 'react'
import { useConditionalConfirm } from '@opentrons/components'
import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'

import type { UseLPCCommandChildProps } from './types'

export interface UseHandleConditionalCleanupResult {
  isExiting: boolean
  showExitConfirmation: boolean
  confirmExitLPC: () => void
  cancelExitLPC: () => void
}

// TOME TODO: Pull out all the commands into their own file, since there is a good
// bit of redundancy.

export function useHandleConditionalCleanup({
  onCloseClick,
  maintenanceRunId,
}: UseLPCCommandChildProps): UseHandleConditionalCleanupResult {
  const [isExiting, setIsExiting] = useState(false)

  const { chainRunCommands } = useChainMaintenanceCommands()

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)

    void chainRunCommands(
      maintenanceRunId,
      [
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: 'leftZ',
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: 'rightZ',
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'x' },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'y' },
        },
        { commandType: 'home' as const, params: {} },
      ],
      true
    ).finally(() => {
      onCloseClick()
    })
  }

  const {
    confirm: confirmExitLPC,
    showConfirmation: showExitConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  return { isExiting, confirmExitLPC, cancelExitLPC, showExitConfirmation }
}
