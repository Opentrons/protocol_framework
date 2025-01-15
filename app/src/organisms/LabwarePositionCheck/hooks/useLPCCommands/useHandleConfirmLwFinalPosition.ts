import {
  moduleCleanupDuringLPCCommands,
  moveLabwareOffDeckCommands,
  retractPipetteAxesSequentiallyCommands,
  savePositionCommands,
} from './commands'

import type {
  LoadedPipette,
  Coordinates,
  CreateCommand,
} from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { BuildMoveLabwareOffDeckParams } from './commands'

interface UseHandleConfirmPositionProps
  extends UseLPCCommandWithChainRunChildProps {
  setErrorMessage: (msg: string | null) => void
}

export interface UseHandleConfirmPositionResult {
  /* Initiate commands to return specific modules to a post-run condition before
   * non-plunger homing the utilized pipette and saving the LPC position. */
  handleConfirmLwFinalPosition: (
    params: BuildMoveLabwareOffDeckParams & {
      onSuccess: () => void
      pipette: LoadedPipette | undefined
    }
  ) => Promise<Coordinates | null>
}

export function useHandleConfirmLwFinalPosition({
  setErrorMessage,
  chainLPCCommands,
}: UseHandleConfirmPositionProps): UseHandleConfirmPositionResult {
  const handleConfirmLwFinalPosition = (
    params: BuildMoveLabwareOffDeckParams & {
      onSuccess: () => void
      pipette: LoadedPipette | undefined
    }
  ): Promise<Coordinates | null> => {
    const { onSuccess, pipette, step } = params
    const { pipetteId } = step

    const confirmCommands: CreateCommand[] = [
      ...savePositionCommands(pipetteId),
      ...retractPipetteAxesSequentiallyCommands(pipette),
      ...moduleCleanupDuringLPCCommands(step),
      ...moveLabwareOffDeckCommands(params),
    ]

    return chainLPCCommands(confirmCommands, false).then(responses => {
      const firstResponse = responses[0]
      if (firstResponse.data.commandType === 'savePosition') {
        const { position } = firstResponse.data?.result ?? { position: null }
        onSuccess()

        return Promise.resolve(position)
      } else {
        setErrorMessage('CheckItem failed to save final position with message')
        return Promise.reject(
          new Error('CheckItem failed to save final position with message')
        )
      }
    })
  }

  return { handleConfirmLwFinalPosition }
}
