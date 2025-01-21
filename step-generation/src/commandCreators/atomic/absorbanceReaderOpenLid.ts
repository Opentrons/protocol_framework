import { uuid } from '../../utils'
import { missingModuleError } from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'

import type { CommandCreator } from '../../types'
import type { AbsorbanceReaderOpenLidCreateCommand } from '@opentrons/shared-data'

export const absorbanceReaderOpenLid: CommandCreator<
  AbsorbanceReaderOpenLidCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
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
        commandType: 'absorbanceReader/openLid',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
  }
}
