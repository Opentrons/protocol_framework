import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
import type { DispenseInPlaceParams } from '@opentrons/shared-data'

export interface DispenseInPlaceAtomicCommandParams
  extends DispenseInPlaceParams {
  isAirGap?: boolean
}
export const dispenseInPlace: CommandCreator<DispenseInPlaceAtomicCommandParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate, isAirGap } = args

  const commands = [
    {
      commandType: 'dispenseInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
      },
      ...(isAirGap && { meta: { isAirGap } }),
    },
  ]
  return {
    commands,
  }
}
