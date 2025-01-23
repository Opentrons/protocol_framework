import type {
  CommandCreator,
  CommonArgs,
  CurriedCommandCreator,
} from '../types'
import { genPyDict, indentLines } from './pythonUtils'

/** Curry a command creator so its args are baked-in,
 * but it is still open to receiving different input states */
export function curryCommandCreator<Args>(
  commandCreator: CommandCreator<Args>,
  args: Args
): CurriedCommandCreator {
  return (_invariantContext, _prevRobotState) =>
    commandCreator(args, _invariantContext, _prevRobotState)
}

export function curryCommandCreatorNoPython<Args>(
  commandCreator: CommandCreator<Args>,
  args: Args
): CurriedCommandCreator {
  return (_invariantContext, _prevRobotState) => {
    const commandCreatorResult = commandCreator(
      args,
      _invariantContext,
      _prevRobotState
    )
    if ('python' in commandCreatorResult) {
      const { python, ...withoutPython } = commandCreatorResult
      return withoutPython
    }
    return commandCreatorResult
  }
}

export function curryCommandTopPython<Args extends CommonArgs>(
  commandCreator: CommandCreator<Args>,
  args: Args
): CurriedCommandCreator {
  return (_invariantContext, _prevRobotState) => {
    const commandCreatorResult = commandCreator(
      args,
      _invariantContext,
      _prevRobotState
    )
    if ('python' in commandCreatorResult) {
      const wrappedPython =
        `with pd_step(${genPyDict({
          ...(args.name && { name: args.name }),
          ...(args.description && { description: args.description }),
        })}):\n` + indentLines(commandCreatorResult.python || `pass`)
      return {
        ...commandCreatorResult,
        python: wrappedPython,
      }
    }
    return commandCreatorResult
  }
}
