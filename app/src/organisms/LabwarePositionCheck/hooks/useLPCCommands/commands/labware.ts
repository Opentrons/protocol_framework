import type { CreateCommand } from '@opentrons/shared-data'
import type { CheckPositionsStep } from '/app/organisms/LabwarePositionCheck/types'

export interface BuildMoveLabwareOffDeckParams {
  step: CheckPositionsStep
}

export function moveLabwareOffDeckCommands({
  step,
}: BuildMoveLabwareOffDeckParams): CreateCommand[] {
  const { adapterId, labwareId } = step

  return adapterId != null
    ? [
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId: adapterId,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ]
    : [
        {
          commandType: 'moveLabware' as const,
          params: {
            labwareId,
            newLocation: 'offDeck',
            strategy: 'manualMoveWithoutPause',
          },
        },
      ]
}
