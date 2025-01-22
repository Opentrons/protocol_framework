import { useState } from 'react'

import { useConditionalConfirm } from '@opentrons/components'

import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'
import { retractSafelyAndHomeCommands } from './commands'

import type { UseLPCCommandChildProps } from './types'
import type { CreateCommand } from '@opentrons/shared-data'

export interface UseHandleConditionalCleanupResult {
  isExiting: boolean
  showExitConfirmation: boolean
  confirmExitLPC: () => void
  cancelExitLPC: () => void
}

export function useHandleConditionalCleanup({
  onCloseClick,
  maintenanceRunId,
}: UseLPCCommandChildProps): UseHandleConditionalCleanupResult {
  const [isExiting, setIsExiting] = useState(false)

  const { chainRunCommands } = useChainMaintenanceCommands()

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)

    const cleanupCommands: CreateCommand[] = [...retractSafelyAndHomeCommands()]

    void chainRunCommands(maintenanceRunId, cleanupCommands, true).finally(
      () => {
        onCloseClick()
      }
    )
  }

  const {
    confirm: confirmExitLPC,
    showConfirmation: showExitConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  return { isExiting, confirmExitLPC, cancelExitLPC, showExitConfirmation }
}
