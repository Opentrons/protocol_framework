import pick from 'lodash/pick'
import { chainPatchUpdaters, fieldHasChanged } from './utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('absorbanceReader'), fields)

const updatePatchOnAbsorbanceReaderFormType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (
    rawForm.absorbanceReaderFormType !== null &&
    fieldHasChanged(rawForm, patch, 'absorbanceReaderFormType')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'wavelengths',
        'referenceWavelength',
        'lidOpen',
        'mode',
        'filePath'
      ),
    }
  }

  return patch
}

const updatePatchOnAbsorbanceReaderModuleId = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (
    rawForm.absorbanceReaderFormType !== null &&
    fieldHasChanged(rawForm, patch, 'moduleId')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'absorbanceReaderFormType',
        'wavelengths',
        'referenceWavelength',
        'lidOpen',
        'mode',
        'filePath'
      ),
    }
  }
  return patch
}

export function dependentFieldsUpdateAbsorbanceReader(
  originalPatch: FormPatch,
  rawForm: FormData
): FormPatch {
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnAbsorbanceReaderFormType(chainPatch, rawForm),
    chainPatch => updatePatchOnAbsorbanceReaderModuleId(chainPatch, rawForm),
  ])
}
