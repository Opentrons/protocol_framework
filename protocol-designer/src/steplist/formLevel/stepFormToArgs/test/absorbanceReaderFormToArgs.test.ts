import { it, describe, expect } from 'vitest'
import { absorbanceReaderFormToArgs } from '../absorbanceReaderFormToArgs'
import type { HydratedAbsorbanceReaderFormData } from '../../../../form-types'

describe('absorbanceReaderFormToArgs', () => {
  it('returns absorbance reader initialize command creator for single mode with reference', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderInitialize',
      fileName: null,
      id: 'stepId',
      lidOpen: null,
      mode: 'single',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: '500',
      referenceWavelengthActive: true,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: ['450'],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderInitialize',
      mode: 'single',
      wavelengths: [450],
      referenceWavelength: 500,
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
  it('returns absorbance reader initialize command creator for single mode with reference, ignorning wavelengths for i > 0', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderInitialize',
      fileName: null,
      id: 'stepId',
      lidOpen: null,
      mode: 'single',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: '500',
      referenceWavelengthActive: true,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: ['450', '600'],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderInitialize',
      mode: 'single',
      wavelengths: [450],
      referenceWavelength: 500,
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
  it('returns absorbance reader initialize command creator for single mode without reference active', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderInitialize',
      fileName: null,
      id: 'stepId',
      lidOpen: null,
      mode: 'single',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: '500',
      referenceWavelengthActive: false,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: ['450'],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderInitialize',
      mode: 'single',
      wavelengths: [450],
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
  it('returns absorbance reader initialize command creator for multi mode', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderInitialize',
      fileName: null,
      id: 'stepId',
      lidOpen: null,
      mode: 'multi',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: null,
      referenceWavelengthActive: false,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: ['450', '600'],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderInitialize',
      mode: 'multi',
      wavelengths: [450, 600],
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
  it('returns absorbance reader read command creator', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderRead',
      fileName: 'output_path.csv',
      id: 'stepId',
      lidOpen: null,
      mode: 'multi',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: null,
      referenceWavelengthActive: false,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: [],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderRead',
      fileName: 'output_path.csv',
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
  it('returns absorbance reader lid command creator to open lid', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderLid',
      fileName: null,
      id: 'stepId',
      lidOpen: true,
      mode: 'single',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: null,
      referenceWavelengthActive: false,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: [],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderOpenLid',
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
  it('returns absorbance reader lid command creator to close lid', () => {
    const formData: HydratedAbsorbanceReaderFormData = {
      absorbanceReaderFormType: 'absorbanceReaderLid',
      fileName: null,
      id: 'stepId',
      lidOpen: false,
      mode: 'single',
      moduleId: 'absorbanceReaderId',
      referenceWavelength: null,
      referenceWavelengthActive: false,
      stepDetails: null,
      stepType: 'absorbanceReader',
      wavelengths: [],
    }

    const expected = {
      module: 'absorbanceReaderId',
      commandCreatorFnName: 'absorbanceReaderCloseLid',
    }
    expect(absorbanceReaderFormToArgs(formData)).toEqual(expected)
  })
})
