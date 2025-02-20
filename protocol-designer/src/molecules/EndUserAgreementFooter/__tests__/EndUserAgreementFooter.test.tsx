import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { EndUserAgreementFooter } from '../index'

const render = () => {
  return renderWithProviders(<EndUserAgreementFooter />)
}

describe('EndUserAgreementFooter', () => {
  it('should render text and links', () => {
    render()
    expect(
      screen.getByRole('link', { name: 'Privacy policy' })
    ).toHaveAttribute('href', 'https://opentrons.com/privacy-policy')
    expect(
      screen.getByRole('link', { name: 'End user license agreement' })
    ).toHaveAttribute('href', 'https://opentrons.com/eula')
  })
})
