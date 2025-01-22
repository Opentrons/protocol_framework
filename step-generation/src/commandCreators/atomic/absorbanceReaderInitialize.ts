import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
import type { AbsorbanceReaderInitializeCreateCommand } from '@opentrons/shared-data'

export const absorbanceReaderInitialize: CommandCreator<
  AbsorbanceReaderInitializeCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, sampleWavelengths, measureMode, referenceWavelength } = args
  return {
    commands: [
      {
        commandType: 'absorbanceReader/initialize',
        key: uuid(),
        params: {
          moduleId,
          measureMode,
          sampleWavelengths,
          ...(referenceWavelength != null ? { referenceWavelength } : {}),
        },
      },
    ],
  }
}
