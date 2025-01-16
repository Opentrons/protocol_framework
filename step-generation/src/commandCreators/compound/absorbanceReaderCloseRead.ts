import * as errorCreators from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { absorbanceReaderCloseLid, absorbanceReaderRead } from '../atomic'

import type {
  AbsorbanceReaderReadArgs,
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
} from '../../types'

export const absorbanceReaderCloseRead: CommandCreator<AbsorbanceReaderReadArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const errors: CommandCreatorError[] = []
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    args.module
  )
  if (absorbanceReaderState == null || args.module == null) {
    errors.push(errorCreators.missingModuleError())
  }
  if (absorbanceReaderState?.initialization == null) {
    errors.push(errorCreators.absorbanceReaderNoInitialization())
  }
  if (errors.length > 0) {
    return { errors }
  }

  const { module, fileName } = args
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
