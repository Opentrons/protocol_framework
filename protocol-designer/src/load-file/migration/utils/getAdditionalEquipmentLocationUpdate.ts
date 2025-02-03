import {
  WASTE_CHUTE_ADDRESSABLE_AREAS,
  RobotType,
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { COLUMN_4_SLOTS, uuid } from '@opentrons/step-generation'
import {
  SavedStepFormState,
  getUnoccupiedSlotForTrash,
} from '../../../step-forms'
import { getCutoutIdByAddressableArea } from '../../../utils'
import { GRIPPER_LOCATION } from '../../../constants'
import type {
  AddressableAreaName,
  CreateCommand,
  LoadLabwareCreateCommand,
  MoveLabwareCreateCommand,
  MoveToAddressableAreaCreateCommand,
  MoveToAddressableAreaForDropTipCreateCommand,
} from '@opentrons/shared-data'

type AdditionalEquipmentLocationUpdate = Record<string, string>

const findTrashBinId = (savedStepForms: SavedStepFormState): string | null => {
  if (!savedStepForms) {
    return null
  }

  for (const stepForm of Object.values(savedStepForms)) {
    if (stepForm.stepType === 'moveLiquid') {
      if (stepForm.dispense_labware.toLowerCase().includes('trash')) {
        return stepForm.dispense_labware
      }
      if (stepForm.dropTip_location.toLowerCase().includes('trash')) {
        return stepForm.dropTip_location
      }
      if (stepForm.blowout_location?.toLowerCase().includes('trash')) {
        return stepForm.blowout_location
      }
    }
    if (stepForm.stepType === 'mix') {
      if (stepForm.dropTip_location.toLowerCase().includes('trash')) {
        return stepForm.dropTip_location
      } else if (stepForm.blowout_location?.toLowerCase().includes('trash')) {
        return stepForm.blowout_location
      }
    }
  }

  return null
}

const getStagingAreaSlotNames = (
  commands: CreateCommand[],
  commandType: 'moveLabware' | 'loadLabware',
  locationKey: 'newLocation' | 'location'
): AddressableAreaName[] => {
  return Object.values(commands)
    .filter(
      (
        command
      ): command is MoveLabwareCreateCommand | LoadLabwareCreateCommand =>
        command.commandType === commandType &&
        command.params[locationKey] !== 'offDeck' &&
        command.params[locationKey] !== 'systemLocation' &&
        'addressableAreaName' in command.params[locationKey] &&
        COLUMN_4_SLOTS.includes(
          command.params[locationKey].addressableAreaName as AddressableAreaName
        )
    )
    .map(command => command.params[locationKey].addressableAreaName)
}

export const getAdditionalEquipmentLocationUpdate = (
  commands: CreateCommand[],
  robotType: RobotType,
  savedStepForms: SavedStepFormState
): AdditionalEquipmentLocationUpdate => {
  const isFlex = robotType === FLEX_ROBOT_TYPE

  const hasGripperCommands = Object.values(commands).some(
    (command): command is MoveLabwareCreateCommand =>
      (command.commandType === 'moveLabware' &&
        command.params.strategy === 'usingGripper') ||
      command.commandType === 'absorbanceReader/closeLid' ||
      command.commandType === 'absorbanceReader/openLid'
  )
  const hasWasteChuteCommands = Object.values(commands).some(
    command =>
      (command.commandType === 'moveToAddressableArea' &&
        WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
          command.params.addressableAreaName as AddressableAreaName
        )) ||
      (command.commandType === 'moveLabware' &&
        command.params.newLocation !== 'offDeck' &&
        command.params.newLocation !== 'systemLocation' &&
        'addressableAreaName' in command.params.newLocation &&
        WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
          command.params.newLocation.addressableAreaName as AddressableAreaName
        ))
  )

  const stagingAreaSlotNames = [
    ...new Set([
      ...getStagingAreaSlotNames(commands, 'moveLabware', 'newLocation'),
      ...getStagingAreaSlotNames(commands, 'loadLabware', 'location'),
    ]),
  ]

  const unoccupiedSlotForTrash = hasWasteChuteCommands
    ? ''
    : getUnoccupiedSlotForTrash(
        commands,
        hasWasteChuteCommands,
        stagingAreaSlotNames
      )

  const trashBinCommand = Object.values(commands).find(
    (
      command
    ): command is
      | MoveToAddressableAreaCreateCommand
      | MoveToAddressableAreaForDropTipCreateCommand =>
      (command.commandType === 'moveToAddressableArea' &&
        (MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
          command.params.addressableAreaName as AddressableAreaName
        ) ||
          command.params.addressableAreaName === 'fixedTrash')) ||
      command.commandType === 'moveToAddressableAreaForDropTip'
  )

  const trashAddressableAreaName = trashBinCommand?.params.addressableAreaName

  const trashBinId = findTrashBinId(savedStepForms)
  const trashCutoutId =
    trashAddressableAreaName != null
      ? getCutoutIdByAddressableArea(
          trashAddressableAreaName as AddressableAreaName,
          isFlex ? 'trashBinAdapter' : 'fixedTrashSlot',
          isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
        )
      : null

  if (trashBinCommand == null && robotType === OT2_ROBOT_TYPE) {
    console.error(
      'expected to find a fixedTrash command for the OT-2 but could not'
    )
  }

  const moveLiquidStepWasteChute =
    savedStepForms != null
      ? Object.values(savedStepForms).find(
          stepForm =>
            stepForm.stepType === 'moveLiquid' &&
            (stepForm.aspirate_labware.includes('wasteChute') ||
              stepForm.dispense_labware.includes('wasteChute') ||
              stepForm.dropTip_location.includes('wasteChute') ||
              stepForm.blowout_location?.includes('wasteChute'))
        )
      : null

  let wasteChuteId: string | null = null
  if (hasWasteChuteCommands && moveLiquidStepWasteChute != null) {
    if (moveLiquidStepWasteChute.aspirate_labware.includes('wasteChute')) {
      wasteChuteId = moveLiquidStepWasteChute.aspirate_labware
    } else if (
      moveLiquidStepWasteChute.dispense_labware.includes('wasteChute')
    ) {
      wasteChuteId = moveLiquidStepWasteChute.dispense_labware
    } else if (
      moveLiquidStepWasteChute.dropTip_location.includes('wasteChute')
    ) {
      wasteChuteId = moveLiquidStepWasteChute.dropTip_location
    } else if (
      moveLiquidStepWasteChute.blowOut_location?.includes('wasteChute')
    ) {
      wasteChuteId = moveLiquidStepWasteChute.blowOut_location
    }
    //  new wasteChuteId generated for if there are only moveLabware commands
  } else if (hasWasteChuteCommands && moveLiquidStepWasteChute == null) {
    wasteChuteId = `${uuid()}:wasteChute`
  }

  const wasteChuteLocationUpdate: AdditionalEquipmentLocationUpdate =
    hasWasteChuteCommands && wasteChuteId != null
      ? {
          [wasteChuteId]: WASTE_CHUTE_CUTOUT,
        }
      : {}

  const gripperId = `${uuid()}:gripper`
  const gripperLocationUpdate: AdditionalEquipmentLocationUpdate = hasGripperCommands
    ? {
        [gripperId]: GRIPPER_LOCATION,
      }
    : {}

  const hardcodedTrashBinIdOt2 = `${uuid()}:fixedTrash`
  const hardcodedTrashBinOt2 = {
    [hardcodedTrashBinIdOt2]: getCutoutIdByAddressableArea(
      'fixedTrash' as AddressableAreaName,
      'fixedTrashSlot',
      OT2_ROBOT_TYPE
    ),
  }

  const hardcodedTrashAddressableAreaName =
    unoccupiedSlotForTrash === WASTE_CHUTE_CUTOUT
      ? 'wasteChute'
      : `movableTrash${unoccupiedSlotForTrash}`

  const hardcodedTrashIdFlex = `${uuid()}:${hardcodedTrashAddressableAreaName}`

  const hardCodedTrashLocation =
    unoccupiedSlotForTrash === ''
      ? ''
      : unoccupiedSlotForTrash === WASTE_CHUTE_CUTOUT
      ? WASTE_CHUTE_CUTOUT
      : getCutoutIdByAddressableArea(
          hardcodedTrashAddressableAreaName as AddressableAreaName,
          'trashBinAdapter',
          FLEX_ROBOT_TYPE
        )

  const hardcodedTrashFlex = {
    [hardcodedTrashIdFlex]: hasWasteChuteCommands
      ? WASTE_CHUTE_CUTOUT
      : hardCodedTrashLocation,
  }

  let trashBinLocationUpdate: AdditionalEquipmentLocationUpdate = hardcodedTrashBinOt2
  if (trashAddressableAreaName != null && trashBinId != null) {
    trashBinLocationUpdate = {
      [trashBinId]: trashCutoutId as string,
    }
  } else if (isFlex) {
    trashBinLocationUpdate = hardcodedTrashFlex
  }

  const stagingAreaLocationUpdate: AdditionalEquipmentLocationUpdate = stagingAreaSlotNames.reduce(
    (acc, slot) => {
      const stagingAreaId = `${uuid()}:stagingArea`
      const cutoutId = getCutoutIdByAddressableArea(
        slot,
        'stagingAreaRightSlot',
        isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE
      )
      return {
        ...acc,
        [stagingAreaId]: cutoutId,
      }
    },
    {}
  )

  return {
    ...stagingAreaLocationUpdate,
    ...gripperLocationUpdate,
    ...wasteChuteLocationUpdate,
    ...trashBinLocationUpdate,
  }
}
