import {
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import type { CreateCommand } from '@opentrons/shared-data'
import type { CheckPositionsStep } from '/app/organisms/LabwarePositionCheck/types'

export interface BuildModulePrepCommandsParams {
  step: CheckPositionsStep
}

export function buildModulePrepCommands({
  step,
}: BuildModulePrepCommandsParams): CreateCommand[] {
  const { moduleId, location } = step

  const moduleType =
    (moduleId != null &&
      'moduleModel' in location &&
      location.moduleModel != null &&
      getModuleType(location.moduleModel)) ??
    null

  if (moduleId == null || moduleType == null) {
    return []
  } else {
    switch (moduleType) {
      case THERMOCYCLER_MODULE_TYPE:
        return [
          {
            commandType: 'thermocycler/openLid',
            params: { moduleId },
          },
        ]
      case HEATERSHAKER_MODULE_TYPE:
        return [
          {
            commandType: 'heaterShaker/closeLabwareLatch',
            params: { moduleId },
          },
          {
            commandType: 'heaterShaker/deactivateShaker',
            params: { moduleId },
          },
          {
            commandType: 'heaterShaker/openLabwareLatch',
            params: { moduleId },
          },
        ]
      default:
        return []
    }
  }
}

export interface BuildMoveLabwareOffDeckParams {
  step: CheckPositionsStep
}

export function buildMoveLabwareOffDeck({
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
