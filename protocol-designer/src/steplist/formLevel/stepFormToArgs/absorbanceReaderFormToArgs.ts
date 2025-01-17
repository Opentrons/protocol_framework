import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_LID,
  ABSORBANCE_READER_READ,
} from '../../../constants'
import type { AbsorbanceReaderArgs } from '@opentrons/step-generation'
import type { HydratedAbsorbanceReaderFormData } from '../../../form-types'

// TODO (nd: 1/15/2025) replace with actual form data once UI is
const DUMMY_INITIALIZATION = {
  wavelengths: [420, 600],
  referenceWavelength: 200,
}

export const absorbanceReaderFormToArgs = (
  hydratedFormData: HydratedAbsorbanceReaderFormData
): AbsorbanceReaderArgs | null => {
  const {
    absorbanceReaderFormType,
    fileName,
    lidOpen,
    moduleId,
    // mode,
    // referenceWavelength,
    // wavelengths,
  } = hydratedFormData
  const lidAction = lidOpen
    ? 'absorbanceReaderOpenLid'
    : 'absorbanceReaderCloseLid'
  switch (absorbanceReaderFormType) {
    case ABSORBANCE_READER_INITIALIZE:
      return {
        module: moduleId,
        mode: 'multi', // TODO (nd: 1/16/2025): reflect actual `mode` form field
        commandCreatorFnName: 'absorbanceReaderInitialize',
        ...DUMMY_INITIALIZATION,
      }
    case ABSORBANCE_READER_READ:
      return {
        module: moduleId,
        commandCreatorFnName: 'absorbanceReaderRead',
        fileName,
      }
    case ABSORBANCE_READER_LID:
      return {
        module: moduleId,
        commandCreatorFnName: lidAction,
      }
    default:
      return null
  }
}
