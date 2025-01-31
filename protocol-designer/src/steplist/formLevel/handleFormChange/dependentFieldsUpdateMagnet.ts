import pick from 'lodash/pick'
import { chainPatchUpdaters, fieldHasChanged } from './utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'
import type { ModuleEntities } from '../../../step-forms'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('magnet'), fields)

const updatePatchOnMagnetActionChange = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'magnetAction')) {
    return { ...patch, ...getDefaultFields('engageHeight') }
  }

  return patch
}

const updatePatchOnMagnetIdChange = (
  patch: FormPatch,
  rawForm: FormData,
  moduleEntities: ModuleEntities
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'moduleId')) {
    const moduleModel = moduleEntities[rawForm.moduleId]?.model
    return { ...patch, moduleModel: moduleModel }
  }
  return patch
}

export function dependentFieldsUpdateMagnet(
  originalPatch: FormPatch,
  rawForm: FormData, // raw = NOT hydrated
  moduleEntities: ModuleEntities
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnMagnetActionChange(chainPatch, rawForm),
    chainPatch =>
      updatePatchOnMagnetIdChange(chainPatch, rawForm, moduleEntities),
  ])
}
