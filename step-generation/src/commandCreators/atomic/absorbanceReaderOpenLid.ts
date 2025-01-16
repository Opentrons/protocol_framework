import { uuid } from '../../utils'
import { missingModuleError } from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'

import type { AbsorbanceReaderLidArgs, CommandCreator } from '../../types'

export const absorbanceReaderOpenLid: CommandCreator<AbsorbanceReaderLidArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    args.module
  )
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
