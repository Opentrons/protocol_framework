import { uuid } from '../../utils'
import { missingModuleError } from '../../errorCreators'
import { getModuleState } from '../../robotStateSelectors'

import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'

export const absorbanceReaderOpenLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const absorbanceReaderState = getModuleState(prevRobotState, args.module)
  if (args.module == null || absorbanceReaderState == null) {
    return {
      errors: [missingModuleError()],
    }
  }

  return {
    commands: [
      {
        commandType: 'absorbanceReader/openLid',
        key: uuid(),
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
