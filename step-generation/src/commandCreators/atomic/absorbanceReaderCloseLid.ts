import { uuid } from '../../utils'
import type { AbsorbanceReaderLidArgs, CommandCreator } from '../../types'

export const absorbanceReaderCloseLid: CommandCreator<AbsorbanceReaderLidArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'absorbanceReader/closeLid',
        key: uuid(),
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
