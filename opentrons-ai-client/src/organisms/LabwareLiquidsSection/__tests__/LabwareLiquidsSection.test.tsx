import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { LabwareLiquidsSection } from '..'
import { FormProvider, useForm } from 'react-hook-form'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {
      labwares: [],
    },
  })

  return (
    <FormProvider {...methods}>
      <LabwareLiquidsSection />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('LabwareLiquidsSection', () => {
  it('should render LabwareLiquidsSection', () => {
    render()

    expect(screen.getByText('Add Opentrons labware')).toBeInTheDocument()
    expect(screen.getByText('No labware added yet')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('should not display the no labware added message if labwares have been added', async () => {
    render()

    expect(screen.getByText('No labware added yet')).toBeInTheDocument()

    const addButton = screen.getByText('Add Opentrons labware')
    fireEvent.click(addButton)

    fireEvent.click(screen.getByText('Tip rack'))
    fireEvent.click(
      await screen.findByText('Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL')
    )
    fireEvent.click(screen.getByText('Save'))

    expect(screen.queryByText('No labware added yet')).not.toBeInTheDocument()
  })

  //   it('should enable the confirm button when labwares have been added', async () => {
  //     render()

  //     expect(screen.getByText('Confirm')).toBeDisabled()

  //     const addButton = screen.getByText('Add Opentrons labware')
  //     fireEvent.click(addButton)

  //     fireEvent.click(screen.getByText('Tip rack'))
  //     fireEvent.click(
  //       await screen.findByText('Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL')
  //     )
  //     fireEvent.click(screen.getByText('Save'))

  //     expect(screen.getByText('Confirm')).toBeEnabled()
  //   })
})
