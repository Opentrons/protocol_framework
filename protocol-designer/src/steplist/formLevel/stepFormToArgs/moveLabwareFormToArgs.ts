import type { HydratedMoveLabwareFormData } from '../../../form-types'
import type { MoveLabwareArgs } from '@opentrons/step-generation'

export const moveLabwareFormToArgs = (
  hydratedFormData: HydratedMoveLabwareFormData
): MoveLabwareArgs => {
  const {
    labware,
    useGripper,
    newLocation,
    stepName,
    stepDetails,
  } = hydratedFormData

  return {
    commandCreatorFnName: 'moveLabware',
    name: stepName,
    description: stepDetails,
    labware: labware.id,
    useGripper,
    newLocation,
  }
}
