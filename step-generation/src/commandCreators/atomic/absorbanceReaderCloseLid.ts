import { uuid } from '../../utils'
import { missingModuleError } from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'
import type { ModuleOnlyParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const absorbanceReaderCloseLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    args.moduleId
  )
  if (args.moduleId == null || absorbanceReaderState == null) {
    return {
      errors: [missingModuleError()],
    }
  }

  return {
    commands: [
      {
        commandType: 'absorbanceReader/closeLid',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
  }
}
