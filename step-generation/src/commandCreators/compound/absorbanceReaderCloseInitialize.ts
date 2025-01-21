import { absorbanceReaderCloseLid, absorbanceReaderInitialize } from '../atomic'
import * as errorCreators from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'

import type {
  AbsorbanceReaderInitializeArgs,
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
} from '../../types'

export const absorbanceReaderCloseInitialize: CommandCreator<AbsorbanceReaderInitializeArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    args.module
  )

  const { module, mode, wavelengths, referenceWavelength } = args
  const errors: CommandCreatorError[] = []
  if (absorbanceReaderState == null) {
    errors.push(errorCreators.missingModuleError())
  }

  if (errors.length > 0) {
    return { errors }
  }
  const commandCreators: CurriedCommandCreator[] = [
    curryCommandCreator(absorbanceReaderCloseLid, {
      commandCreatorFnName: 'absorbanceReaderCloseLid',
      module,
    }),
    curryCommandCreator(absorbanceReaderInitialize, {
      commandCreatorFnName: 'absorbanceReaderInitialize',
      module,
      mode,
      wavelengths,
      referenceWavelength,
    }),
  ]
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
