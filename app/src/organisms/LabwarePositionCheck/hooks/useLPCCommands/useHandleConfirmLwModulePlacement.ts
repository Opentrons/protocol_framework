import {
  moduleInitDuringLPCCommands,
  moveToWellCommands,
  savePositionCommands,
} from './commands'

import type {
  MoveLabwareCreateCommand,
  Coordinates,
  CreateCommand,
} from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { CheckPositionsStep } from '/app/organisms/LabwarePositionCheck/types'

export interface UseHandleConfirmPlacementProps
  extends UseLPCCommandWithChainRunChildProps {
  setErrorMessage: (msg: string | null) => void
}

export interface UseHandleConfirmPlacementResult {
  /* Initiate commands to finalize pre-protocol run conditions for specific modules
   before moving the pipette to the initial LPC position. */
  handleConfirmLwModulePlacement: (
    params: BuildMoveLabwareCommandParams
  ) => Promise<Coordinates | null>
}

export function useHandleConfirmLwModulePlacement({
  chainLPCCommands,
  mostRecentAnalysis,
  setErrorMessage,
}: UseHandleConfirmPlacementProps): UseHandleConfirmPlacementResult {
  const handleConfirmLwModulePlacement = (
    params: BuildMoveLabwareCommandParams
  ): Promise<Coordinates | null> => {
    const { pipetteId } = params.step

    const confirmCommands: CreateCommand[] = [
      ...buildMoveLabwareCommand(params),
      ...moduleInitDuringLPCCommands(mostRecentAnalysis),
      ...moveToWellCommands(params.step),
      ...savePositionCommands(pipetteId),
    ]

    return chainLPCCommands(confirmCommands, false).then(responses => {
      const finalResponse = responses[responses.length - 1]
      if (finalResponse.data.commandType === 'savePosition') {
        const { position } = finalResponse.data.result ?? { position: null }

        return Promise.resolve(position)
      } else {
        setErrorMessage(
          'CheckItem failed to save position for initial placement.'
        )
        return Promise.reject(
          new Error('CheckItem failed to save position for initial placement.')
        )
      }
    })
  }

  return { handleConfirmLwModulePlacement }
}

interface BuildMoveLabwareCommandParams {
  step: CheckPositionsStep
}

function buildMoveLabwareCommand({
  step,
}: BuildMoveLabwareCommandParams): MoveLabwareCreateCommand[] {
  const { labwareId, moduleId, adapterId, location } = step

  const newLocation =
    moduleId != null ? { moduleId } : { slotName: location.slotName }

  if (adapterId != null) {
    return [
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId: adapterId,
          newLocation,
          strategy: 'manualMoveWithoutPause',
        },
      },
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId,
          newLocation:
            adapterId != null
              ? { labwareId: adapterId }
              : { slotName: location.slotName },
          strategy: 'manualMoveWithoutPause',
        },
      },
    ]
  } else {
    return [
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId,
          newLocation,
          strategy: 'manualMoveWithoutPause',
        },
      },
    ]
  }
}
