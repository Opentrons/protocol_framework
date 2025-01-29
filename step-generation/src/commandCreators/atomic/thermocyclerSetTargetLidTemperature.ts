import { uuid } from '../../utils'
import type { TemperatureParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'
export const thermocyclerSetTargetLidTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId, celsius } = args
  return {
    commands: [
      {
        commandType: 'thermocycler/setTargetLidTemperature',
        key: uuid(),
        params: {
          moduleId,
          celsius,
        },
      },
    ],
  }
}
