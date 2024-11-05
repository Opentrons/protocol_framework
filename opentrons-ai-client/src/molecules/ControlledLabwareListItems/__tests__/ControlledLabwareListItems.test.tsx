import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ControlledLabwareListItems } from '..'
import { FormProvider, useForm } from 'react-hook-form'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {
      labwares: [
        {
          labwareURI: 'opentrons/eppendorf_96_tiprack_1000ul_eptips/1',
          count: 1,
        },
        {
          labwareURI: 'opentrons/eppendorf_96_tiprack_10ul_eptips/1',
          count: 1,
        },
      ],
    },
  })

  return (
    <FormProvider {...methods}>
      <ControlledLabwareListItems />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ControlledLabwareListItems', () => {
  it('should render if displayControlledLabwareListItems is true', () => {
    render()

    expect(
      screen.getByText('(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL')
    ).toBeInTheDocument()
    expect(
      screen.getByText('(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 10 µL')
    ).toBeInTheDocument()
  })

  it('should update the count of a labware when the count is changed', async () => {
    render()

    const input = screen.getAllByText('1')[0]
    fireEvent.click(input)

    const option = screen.getByText('2')
    fireEvent.click(option)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('should remove a labware when the remove button is clicked', async () => {
    render()

    expect(
      screen.getByText('(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL')
    ).toBeInTheDocument()

    const removeButton = screen.getAllByText('remove')[0]
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(
        screen.queryByText('(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL')
      ).not.toBeInTheDocument()
    })
  })
})
