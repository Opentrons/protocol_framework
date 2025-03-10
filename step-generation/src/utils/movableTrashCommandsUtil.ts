import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
  moveToAddressableAreaForDropTip,
} from '../commandCreators/atomic'
import { ZERO_OFFSET } from '../constants'
import { curryCommandCreator } from './curryCommandCreator'
import { getTrashBinAddressableAreaName } from './misc'
import type {
  RobotState,
  InvariantContext,
  CurriedCommandCreator,
} from '../types'

export type MovableTrashCommandsTypes =
  | 'airGap'
  | 'blowOut'
  | 'dispense'
  | 'dropTip'
  | 'moveToWell'

interface MovableTrashCommandArgs {
  type: MovableTrashCommandsTypes
  pipetteId: string
  invariantContext: InvariantContext
  prevRobotState: RobotState
  volume?: number
  flowRate?: number
}
/** Helper fn for movable trash commands for dispense, aspirate, air_gap, drop_tip and blow_out commands */
export const movableTrashCommandsUtil = (
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] => {
  const {
    pipetteId,
    type,
    invariantContext,
    prevRobotState,
    volume,
    flowRate,
  } = args
  const offset = ZERO_OFFSET

  let inPlaceCommands: CurriedCommandCreator[] = []

  const addressableAreaName = getTrashBinAddressableAreaName(
    invariantContext.additionalEquipmentEntities
  )
  if (addressableAreaName == null) {
    console.error(
      'expected to find addressableAreaName for movableTrashCommandsUtil but could not'
    )
  } else {
    switch (type) {
      case 'airGap': {
        inPlaceCommands =
          flowRate != null && volume != null
            ? [
                curryCommandCreator(moveToAddressableArea, {
                  pipetteId,
                  addressableAreaName,
                  offset,
                }),
                curryCommandCreator(aspirateInPlace, {
                  pipetteId,
                  volume,
                  flowRate,
                }),
              ]
            : []

        break
      }
      case 'dropTip': {
        inPlaceCommands = !prevRobotState.tipState.pipettes[pipetteId]
          ? []
          : [
              curryCommandCreator(moveToAddressableAreaForDropTip, {
                pipetteId,
                addressableAreaName,
              }),
              curryCommandCreator(dropTipInPlace, {
                pipetteId,
              }),
            ]

        break
      }
      case 'dispense': {
        inPlaceCommands =
          flowRate != null && volume != null
            ? [
                curryCommandCreator(moveToAddressableArea, {
                  pipetteId,
                  addressableAreaName,
                  offset,
                }),
                curryCommandCreator(dispenseInPlace, {
                  pipetteId,
                  volume,
                  flowRate,
                }),
              ]
            : []
        break
      }
      case 'blowOut': {
        inPlaceCommands =
          flowRate != null
            ? [
                curryCommandCreator(moveToAddressableArea, {
                  pipetteId,
                  addressableAreaName,
                  offset,
                }),
                curryCommandCreator(blowOutInPlace, {
                  pipetteId,
                  flowRate,
                }),
              ]
            : []
        break
      }
      case 'moveToWell': {
        inPlaceCommands = [
          curryCommandCreator(moveToAddressableArea, {
            pipetteId,
            addressableAreaName,
            offset,
          }),
        ]
      }
    }
  }

  return inPlaceCommands
}
