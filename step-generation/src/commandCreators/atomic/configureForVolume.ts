import { uuid } from '../../utils'
import type { ConfigureForVolumeParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const configureForVolume: CommandCreator<ConfigureForVolumeParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume } = args

  // No-op if there is no pipette
  if (!invariantContext.pipetteEntities[pipetteId]) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      commandType: 'configureForVolume' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
      },
    },
  ]
  return {
    commands,
  }
}
