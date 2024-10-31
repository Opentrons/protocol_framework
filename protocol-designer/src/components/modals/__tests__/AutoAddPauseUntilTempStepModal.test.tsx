import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { AutoAddPauseUntilTempStepModal } from '../AutoAddPauseUntilTempStepModal'
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import type { ComponentProps } from 'react'

vi.mock('../../../feature-flags/selectors')

const render = (
  props: ComponentProps<typeof AutoAddPauseUntilTempStepModal>
) => {
  return renderWithProviders(<AutoAddPauseUntilTempStepModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AutoAddPauseUntilTempStepModal ', () => {
  let props: ComponentProps<typeof AutoAddPauseUntilTempStepModal>
  beforeEach(() => {
    props = {
      displayTemperature: '10',
      handleCancelClick: vi.fn(),
      handleContinueClick: vi.fn(),
      displayModule: 'mock module',
    }
  })
  it('should render the correct text with 10 C temp and buttons are clickable', () => {
    render(props)
    screen.getByText('Pause protocol until mock module is at 10˚C')
    screen.getByText(
      'Build a pause step to wait until mock module reaches 10˚C before continuing to the next step.'
    )
    screen.getByText(
      'Build a pause step later if you want your protocol to proceed to the next step while the mock module goes to 10˚C'
    )

    const cancelBtn = screen.getByRole('button', {
      name: 'Build pause later',
    })
    const contBtn = screen.getByRole('button', { name: 'Pause protocol' })
    fireEvent.click(cancelBtn)
    expect(props.handleCancelClick).toHaveBeenCalled()
    fireEvent.click(contBtn)
    expect(props.handleContinueClick).toHaveBeenCalled()
  })
})
