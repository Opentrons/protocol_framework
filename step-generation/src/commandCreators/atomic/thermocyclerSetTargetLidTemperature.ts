import { uuid } from '../../utils'
import type { TemperatureParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'
export const thermocyclerSetTargetLidTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/setTargetLidTemperature',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
          celsius: args.celsius
        },
      },
    ],
  }
}
