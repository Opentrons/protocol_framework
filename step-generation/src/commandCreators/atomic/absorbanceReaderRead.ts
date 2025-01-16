import * as errorCreators from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'
import { uuid } from '../../utils'
import type {
  AbsorbanceReaderReadArgs,
  CommandCreator,
  CommandCreatorError,
} from '../../types'

export const absorbanceReaderRead: CommandCreator<AbsorbanceReaderReadArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module, fileName } = args
  const errors: CommandCreatorError[] = []
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    module
  )
  if (absorbanceReaderState == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  if (absorbanceReaderState.initialization === null) {
    errors.push(errorCreators.absorbanceReaderLidClosed())
  }

  return errors.length > 0
    ? { errors }
    : {
        commands: [
          {
            commandType: 'absorbanceReader/read',
            key: uuid(),
            params: {
              moduleId: module,
              ...(fileName != null ? { fileName } : {}),
            },
          },
        ],
      }
}
