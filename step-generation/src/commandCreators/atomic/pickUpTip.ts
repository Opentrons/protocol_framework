import { COLUMN } from '@opentrons/shared-data'
import {
  pipettingIntoColumn4,
  possiblePipetteCollision,
} from '../../errorCreators'
import { COLUMN_4_SLOTS } from '../../constants'
import { uuid, getIsSafePipetteMovement } from '../../utils'
import type {
  NozzleConfigurationStyle,
  PickUpTipParams,
} from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

interface PickUpTipAtomicParams extends PickUpTipParams {
  nozzles?: NozzleConfigurationStyle
}

export const pickUpTip: CommandCreator<PickUpTipAtomicParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, labwareId, wellName, nozzles } = args
  const errors: CommandCreatorError[] = []

  const is96Channel =
    invariantContext.pipetteEntities[pipetteId]?.spec.channels === 96

  if (
    is96Channel &&
    nozzles === COLUMN &&
    !getIsSafePipetteMovement(
      prevRobotState,
      invariantContext,
      pipetteId,
      labwareId,
      labwareId,
      //  we don't adjust the offset when moving to the tiprack
      { x: 0, y: 0 },
      wellName
    )
  ) {
    errors.push(possiblePipetteCollision())
  }

  const tiprackSlot = prevRobotState.labware[labwareId].slot
  if (COLUMN_4_SLOTS.includes(tiprackSlot)) {
    errors.push(pipettingIntoColumn4({ typeOfStep: 'pick up tip' }))
  } else if (prevRobotState.labware[tiprackSlot] != null) {
    const adapterSlot = prevRobotState.labware[tiprackSlot].slot
    if (COLUMN_4_SLOTS.includes(adapterSlot)) {
      errors.push(pipettingIntoColumn4({ typeOfStep: 'pick up tip' }))
    }
  }

  if (errors.length > 0) {
    return { errors }
  }
  return {
    commands: [
      {
        commandType: 'pickUpTip',
        key: uuid(),
        params: {
          pipetteId,
          labwareId,
          wellName,
        },
      },
    ],
  }
}
