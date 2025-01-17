import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_LID,
  ABSORBANCE_READER_READ,
} from '../../../constants'
import type { AbsorbanceReaderArgs } from '@opentrons/step-generation'
import type { HydratedAbsorbanceReaderFormData } from '../../../form-types'

export const absorbanceReaderFormToArgs = (
  hydratedFormData: HydratedAbsorbanceReaderFormData
): AbsorbanceReaderArgs | null => {
  const {
    absorbanceReaderFormType,
    fileName,
    lidOpen,
    moduleId,
    mode,
    referenceWavelength,
    referenceWavelengthActive,
    wavelengths,
  } = hydratedFormData
  const lidAction = lidOpen
    ? 'absorbanceReaderOpenLid'
    : 'absorbanceReaderCloseLid'
  switch (absorbanceReaderFormType) {
    case ABSORBANCE_READER_INITIALIZE:
      const rawWavelengths =
        (mode === 'single' ? wavelengths?.slice(0, 1) ?? null : wavelengths) ?? // only take first wavelength in single mode
        []
      return {
        module: moduleId,
        commandCreatorFnName: 'absorbanceReaderInitialize',
        mode,
        wavelengths: rawWavelengths?.map(wavelength => parseFloat(wavelength)),
        ...(mode === 'single' &&
        referenceWavelengthActive &&
        referenceWavelength != null
          ? { referenceWavelength: parseFloat(referenceWavelength) }
          : {}),
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
