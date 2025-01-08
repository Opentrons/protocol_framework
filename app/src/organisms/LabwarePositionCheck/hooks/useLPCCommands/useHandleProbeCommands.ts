import { useState } from 'react'

import {
  moveToMaintenancePositionCommands,
  retractPipetteAxesSequentiallyCommands,
  verifyProbeAttachmentAndHomeCommands,
} from './commands'

import type { CreateCommand, LoadedPipette } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'

export interface UseProbeCommandsResult {
  moveToMaintenancePosition: (pipette: LoadedPipette | undefined) => void
  createProbeAttachmentHandler: (
    pipetteId: string,
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ) => () => Promise<void>
  createProbeDetachmentHandler: (
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ) => () => Promise<void>
  unableToDetect: boolean
  setShowUnableToDetect: (canDetect: boolean) => void
}

export function useHandleProbeCommands({
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseProbeCommandsResult {
  const [showUnableToDetect, setShowUnableToDetect] = useState<boolean>(false)

  const moveToMaintenancePosition = (
    pipette: LoadedPipette | undefined
  ): void => {
    const maintenancePositionCommands: CreateCommand[] = [
      ...moveToMaintenancePositionCommands(pipette),
    ]

    void chainLPCCommands(maintenancePositionCommands, false)
  }

  const createProbeAttachmentHandler = (
    pipetteId: string,
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ): (() => Promise<void>) => {
    const attachmentCommands: CreateCommand[] = [
      ...verifyProbeAttachmentAndHomeCommands(pipetteId, pipette),
    ]

    return () =>
      chainLPCCommands(attachmentCommands, false)
        .then(() => {
          onSuccess()
        })
        .catch(() => {
          setShowUnableToDetect(true)

          // TOME TODO: You probably want to hoist this component out of the step.
          // Stop propagation to prevent error screen routing.
          return Promise.resolve()
        })
  }

  const createProbeDetachmentHandler = (
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ): (() => Promise<void>) => {
    const detatchmentCommands: CreateCommand[] = [
      ...retractPipetteAxesSequentiallyCommands(pipette),
    ]

    return () =>
      chainLPCCommands(detatchmentCommands, false).then(() => {
        onSuccess()
      })
  }

  return {
    moveToMaintenancePosition,
    createProbeAttachmentHandler,
    unableToDetect: showUnableToDetect,
    setShowUnableToDetect,
    createProbeDetachmentHandler,
  }
}
