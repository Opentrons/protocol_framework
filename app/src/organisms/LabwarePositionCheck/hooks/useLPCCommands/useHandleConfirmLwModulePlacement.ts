import { getModuleType, HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import type {
  CreateCommand,
  MoveLabwareCreateCommand,
  Coordinates,
} from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { CheckPositionsStep } from '/app/organisms/LabwarePositionCheck/types'

const PROBE_LENGTH_MM = 44.5

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
    const { pipetteId, labwareId } = params.step

    return chainLPCCommands(
      [
        ...buildMoveLabwareCommand(params),
        ...mostRecentAnalysis.modules.reduce<CreateCommand[]>((acc, mod) => {
          if (getModuleType(mod.model) === HEATERSHAKER_MODULE_TYPE) {
            return [
              ...acc,
              {
                commandType: 'heaterShaker/closeLabwareLatch',
                params: { moduleId: mod.id },
              },
            ]
          }
          return acc
        }, []),
        {
          commandType: 'moveToWell' as const,
          params: {
            pipetteId,
            labwareId,
            wellName: 'A1',
            wellLocation: {
              origin: 'top' as const,
              offset: { x: 0, y: 0, z: PROBE_LENGTH_MM },
            },
          },
        },
        { commandType: 'savePosition', params: { pipetteId } },
      ],
      false
    ).then(responses => {
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
