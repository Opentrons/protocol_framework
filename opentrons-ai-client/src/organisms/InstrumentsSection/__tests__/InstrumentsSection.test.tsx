import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { InstrumentsSection } from '..'
import { FormProvider, useForm } from 'react-hook-form'

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <InstrumentsSection />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ApplicationSection', () => {
  it('should render scientific application dropdown, describe input and confirm button', () => {
    render()

    expect(
      screen.getByText('What robot would you like to use?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('What pipettes would you like to use?')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Do you want to use the Flex Gripper?')
    ).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })

  it('should not render left and right mount dropdowns if other pipettes option or Opentrons OT-2 robot is not selected', () => {
    render()

    expect(screen.queryByText('Left mount')).not.toBeInTheDocument()
    expect(screen.queryByText('Right mount')).not.toBeInTheDocument()
  })

  it('should render left and right mount dropdowns if other pipettes is selected', () => {
    render()

    expect(screen.queryByText('Left mount')).not.toBeInTheDocument()
    expect(screen.queryByText('Right mount')).not.toBeInTheDocument()

    const otherPipettesRadioButton = screen.getByLabelText('Other pipettes')
    fireEvent.click(otherPipettesRadioButton)

    expect(screen.getByText('Left mount')).toBeInTheDocument()
    expect(screen.getByText('Right mount')).toBeInTheDocument()
  })

  it('should render left and right mount dropdowns if Opentrons OT-2 is selected', () => {
    render()

    expect(
      screen.queryByText('What instruments would you like to use?')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Left mount')).not.toBeInTheDocument()
    expect(screen.queryByText('Right mount')).not.toBeInTheDocument()

    const ot2Radio = screen.getByLabelText('Opentrons OT-2')
    fireEvent.click(ot2Radio)

    expect(
      screen.getByText('What instruments would you like to use?')
    ).toBeInTheDocument()
    expect(screen.getByText('Left mount')).toBeInTheDocument()
    expect(screen.getByText('Right mount')).toBeInTheDocument()
  })

  it('should not render pipettes and flex gripper radio buttons if Opentrons OT-2 is selected', () => {
    render()

    const ot2Radio = screen.getByLabelText('Opentrons OT-2')
    fireEvent.click(ot2Radio)

    expect(
      screen.queryByText('What pipettes would you like to use?')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Do you want to use the Flex Gripper?')
    ).not.toBeInTheDocument()
  })

  // it('should enable confirm button when all fields are filled', async () => {
  //   render()

  //   const applicationDropdown = screen.getByText('Select an option')
  //   fireEvent.click(applicationDropdown)

  //   const basicAliquotingOption = screen.getByText('Basic aliquoting')
  //   fireEvent.click(basicAliquotingOption)

  //   const describeInput = screen.getByRole('textbox')
  //   fireEvent.change(describeInput, { target: { value: 'Test description' } })

  //   const confirmButton = screen.getByRole('button')
  //   await waitFor(() => {
  //     expect(confirmButton).toBeEnabled()
  //   })
  // })

  // it('should disable confirm button when all fields are not filled', () => {
  //   render()

  //   const confirmButton = screen.getByRole('button')
  //   expect(confirmButton).toBeDisabled()
  // })
})
