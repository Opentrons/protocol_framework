import * as errorCreators from '../../errorCreators'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { absorbanceReaderCloseLid, absorbanceReaderRead } from '../atomic'

import type {
  AbsorbanceReaderReadArgs,
  CommandCreator,
  CurriedCommandCreator,
} from '../../types'

export const absorbanceReaderCloseRead: CommandCreator<AbsorbanceReaderReadArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  if (args.module == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }
  const { module, filePath } = args
  const commandCreators: CurriedCommandCreator[] = [
    curryCommandCreator(absorbanceReaderCloseLid, {
      commandCreatorFnName: 'absorbanceReaderCloseLid',
      module,
    }),
    curryCommandCreator(absorbanceReaderRead, {
      commandCreatorFnName: 'absorbanceReaderRead',
      module,
      filePath,
    }),
  ]
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
