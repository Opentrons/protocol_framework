import { useState } from 'react'
import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'
import { retractSafelyAndHomeCommands } from './commands'

import type { UseLPCCommandChildProps } from './types'
import type { CreateCommand } from '@opentrons/shared-data'

export interface UseHandleConditionalCleanupResult {
  isExiting: boolean
  handleCleanUpAndClose: () => Promise<void>
}

export function useHandleCleanup({
  onCloseClick,
  maintenanceRunId,
}: UseLPCCommandChildProps): UseHandleConditionalCleanupResult {
  const [isExiting, setIsExiting] = useState(false)
  const { chainRunCommands } = useChainMaintenanceCommands()

  const handleCleanUpAndClose = (): Promise<void> => {
    setIsExiting(true)
    const cleanupCommands: CreateCommand[] = [...retractSafelyAndHomeCommands()]

    return chainRunCommands(maintenanceRunId, cleanupCommands, true)
      .then(() => {
        onCloseClick()
      })
      .catch(() => {
        onCloseClick()
      })
  }

  return { isExiting, handleCleanUpAndClose }
}
