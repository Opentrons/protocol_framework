import { uuid } from '../../utils'
import type { MoveToAddressableAreaParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

interface MoveToAddressableAreaAtomicParams extends MoveToAddressableAreaParams{
  isForDropTip?: boolean
}
export const moveToAddressableArea: CommandCreator<MoveToAddressableAreaAtomicParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, addressableAreaName, offset , isForDropTip} = args


    // No-op if there is no tip
    if (isForDropTip && !prevRobotState.tipState.pipettes[pipetteId]) {
      return {
        commands: [],
      }
    }

  const commands = [
    {
      commandType: 'moveToAddressableArea' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName,
        offset,
      },
    },
  ]
  return {
    commands,
  }
}
