import { uuid } from '../../utils'
import type { ConfigureNozzleLayoutParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const configureNozzleLayout: CommandCreator<ConfigureNozzleLayoutParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, configurationParams } = args

  const commands = [
    {
      commandType: 'configureNozzleLayout' as const,
      key: uuid(),
      params: {
        pipetteId,
        configurationParams,
      },
    },
  ]
  return {
    commands,
  }
}
