import { uuid } from '../../utils'
import type {
  AbsorbanceReaderInitializeArgs,
  CommandCreator,
} from '../../types'

export const absorbanceReaderInitialize: CommandCreator<AbsorbanceReaderInitializeArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module: moduleId, mode, wavelengths, referenceWavelength } = args

  return {
    commands: [
      {
        commandType: 'absorbanceReader/initialize',
        key: uuid(),
        params: {
          moduleId,
          measureMode: mode,
          sampleWavelengths: wavelengths,
          ...(referenceWavelength != null ? { referenceWavelength } : {}),
        },
      },
    ],
  }
}
