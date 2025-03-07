import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
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
import type { AddressableAreaName, CutoutId } from '@opentrons/shared-data'
import type {
  RobotState,
  InvariantContext,
  CurriedCommandCreator,
} from '../types'

interface MovableTrashCommandArgs {
  pipetteId: string
  invariantContext: InvariantContext
  prevRobotState?: RobotState
  volume?: number
  flowRate?: number
}

/** Helper fn for movable trash commands for dispense, aspirate, air_gap, drop_tip and blow_out commands */

function getAddressableAreaName(
  invariantContext: InvariantContext
): AddressableAreaName | null {
  const trash = Object.values(
    invariantContext.additionalEquipmentEntities
  ).find(aE => aE.name === 'trashBin')
  const trashLocation = trash != null ? (trash.location as CutoutId) : null

  const deckDef = getDeckDefFromRobotType(
    trashLocation === ('cutout12' as CutoutId)
      ? OT2_ROBOT_TYPE
      : FLEX_ROBOT_TYPE
  )
  let cutouts: Record<CutoutId, AddressableAreaName[]> | null = null
  if (deckDef.robot.model === FLEX_ROBOT_TYPE) {
    cutouts =
      deckDef.cutoutFixtures.find(
        cutoutFixture => cutoutFixture.id === 'trashBinAdapter'
      )?.providesAddressableAreas ?? null
  } else if (deckDef.robot.model === OT2_ROBOT_TYPE) {
    cutouts =
      deckDef.cutoutFixtures.find(
        cutoutFixture => cutoutFixture.id === 'fixedTrashSlot'
      )?.providesAddressableAreas ?? null
  }

  const addressableAreaName =
    trashLocation != null && cutouts != null
      ? cutouts[trashLocation]?.[0] ?? null
      : null
  if (addressableAreaName == null) {
    console.error(
      `expected to find addressableAreaName with trashLocation ${trashLocation} but could not`
    )
  }
  return addressableAreaName
}

export function airGapInMovableTrash(
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] {
  const { pipetteId, invariantContext, volume, flowRate } = args
  const offset = ZERO_OFFSET
  const addressableAreaName = getAddressableAreaName(invariantContext)
  if (addressableAreaName == null || flowRate == null || volume == null) {
    return []
  }
  return [
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
}

export function dropTipInMovableTrash(
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] {
  const { pipetteId, invariantContext, prevRobotState } = args
  const addressableAreaName = getAddressableAreaName(invariantContext)
  if (addressableAreaName == null) {
    return []
  }
  // NOTE: This seems to be a bug in the previous implementation:
  // If prevRobotState *IS* null, we would generate the commands, which seems wrong.
  // But there is a test that wants that behavior.
  if (prevRobotState != null && !prevRobotState.tipState.pipettes[pipetteId]) {
    return []
  }
  return [
    curryCommandCreator(moveToAddressableAreaForDropTip, {
      pipetteId,
      addressableAreaName,
    }),
    curryCommandCreator(dropTipInPlace, {
      pipetteId,
    }),
  ]
}

export function dispenseInMovableTrash(
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] {
  const { pipetteId, invariantContext, volume, flowRate } = args
  const offset = ZERO_OFFSET
  const addressableAreaName = getAddressableAreaName(invariantContext)
  if (addressableAreaName == null || flowRate == null || volume == null) {
    return []
  }
  return [
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
}

export function blowOutInMovableTrash(
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] {
  const { pipetteId, invariantContext, flowRate } = args
  const offset = ZERO_OFFSET
  const addressableAreaName = getAddressableAreaName(invariantContext)
  if (addressableAreaName == null || flowRate == null) {
    return []
  }
  return [
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
}

export function moveToMovableTrash(
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] {
  const { pipetteId, invariantContext } = args
  const offset = ZERO_OFFSET
  const addressableAreaName = getAddressableAreaName(invariantContext)
  if (addressableAreaName == null) {
    return []
  }
  return [
    curryCommandCreator(moveToAddressableArea, {
      pipetteId,
      addressableAreaName,
      offset,
    }),
  ]
}
