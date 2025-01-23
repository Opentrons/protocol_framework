import { uuid } from '../../utils'
import type { ModuleOnlyParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'
export const heaterShakerDeactivateHeater: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'heaterShaker/deactivateHeater',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
  }
}
