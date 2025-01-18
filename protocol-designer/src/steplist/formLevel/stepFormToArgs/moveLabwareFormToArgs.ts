import type { HydratedMoveLabwareFormData } from '../../../form-types'
import type { MoveLabwareArgs } from '@opentrons/step-generation'

export const moveLabwareFormToArgs = (
  hydratedFormData: HydratedMoveLabwareFormData
): MoveLabwareArgs => {
  const { fields, stepName, stepDetails } = hydratedFormData
  const { labware, useGripper, newLocation } = fields

  return {
    commandCreatorFnName: 'moveLabware',
    name: stepName,
    description: stepDetails,
    labware: labware.id,
    useGripper,
    newLocation,
  }
}
