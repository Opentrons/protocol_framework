import { useState } from 'react'

import {
  retractPipetteAxesSequentiallyCommands,
  verifyProbeAttachmentAndHomeCommands,
} from './commands'

import type { CreateCommand, LoadedPipette } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'

export interface UseProbeCommandsResult {
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

  const createProbeAttachmentHandler = (
    pipetteId: string,
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ): (() => Promise<void>) => {
    const attachmentCommands: CreateCommand[] = [
      ...verifyProbeAttachmentAndHomeCommands(pipetteId, pipette),
    ]

    return () =>
      chainLPCCommands(attachmentCommands, false, true)
        .then(() => {
          onSuccess()
        })
        .catch(() => {
          setShowUnableToDetect(true)

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
    createProbeAttachmentHandler,
    unableToDetect: showUnableToDetect,
    setShowUnableToDetect,
    createProbeDetachmentHandler,
  }
}
