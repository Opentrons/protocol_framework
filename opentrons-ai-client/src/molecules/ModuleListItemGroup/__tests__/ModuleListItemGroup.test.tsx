import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ModuleListItemGroup } from '../index'
import { describe, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import type { DisplayModules } from '../../../organisms/ModulesSection'

const modulesMock: DisplayModules[] = [
  {
    type: 'heaterShakerModuleType',
    model: 'heaterShakerModuleV1',
    name: 'Heater-Shaker Module GEN1',
  },
  {
    type: 'temperatureModuleType',
    model: 'temperatureModuleV2',
    name: 'Temperature Module GEN2',
  },
]

const TestFormProviderComponent = () => {
  const methods = useForm({
    defaultValues: {
      modules: modulesMock,
    },
  })

  return (
    <FormProvider {...methods}>
      <ModuleListItemGroup />
    </FormProvider>
  )
}

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<TestFormProviderComponent />, {
    i18nInstance: i18n,
  })
}

describe('ModuleListItemGroup', () => {
  it('should render ModuleListItemGroup component', () => {
    render()

    expect(screen.getAllByText('Adapter').length).toBe(2)
    expect(screen.getAllByText('remove').length).toBe(2)

    screen.getByAltText('heaterShakerModuleType')
    screen.getByText('Heater-Shaker Module GEN1')

    screen.getByAltText('temperatureModuleType')
    screen.getByText('Temperature Module GEN2')
  })

  it('should remove the list item if remove is clicked', async () => {
    render()

    const removeListItemButton = screen.getAllByText('remove')[0]

    fireEvent.click(removeListItemButton)

    expect(
      screen.queryByText('Heater-Shaker Module GEN1')
    ).not.toBeInTheDocument()
  })
})
