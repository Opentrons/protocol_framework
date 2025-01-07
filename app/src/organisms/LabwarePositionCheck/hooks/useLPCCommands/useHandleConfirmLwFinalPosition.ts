import { getModuleType, HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import { buildMoveLabwareOffDeck } from './helpers'

import type {
  CreateCommand,
  LoadedPipette,
  Coordinates,
} from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import type { BuildMoveLabwareOffDeckParams } from './helpers'

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
    const { moduleId, pipetteId, location } = step

    const moduleType =
      (moduleId != null &&
        'moduleModel' in location &&
        location.moduleModel != null &&
        getModuleType(location.moduleModel)) ??
      null
    const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
      pipette?.mount === 'left' ? 'leftZ' : 'rightZ'

    const heaterShakerPrepCommands: CreateCommand[] =
      moduleId != null &&
      moduleType != null &&
      moduleType === HEATERSHAKER_MODULE_TYPE
        ? [
            {
              commandType: 'heaterShaker/openLabwareLatch',
              params: { moduleId },
            },
          ]
        : []
    const confirmPositionCommands: CreateCommand[] = [
      {
        commandType: 'retractAxis' as const,
        params: {
          axis: pipetteZMotorAxis,
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
      ...heaterShakerPrepCommands,
      ...buildMoveLabwareOffDeck(params),
    ]

    return chainLPCCommands(
      [
        { commandType: 'savePosition', params: { pipetteId } },
        ...confirmPositionCommands,
      ],
      false
    ).then(responses => {
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
