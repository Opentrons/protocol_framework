import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { HeadlineTagBtn } from '..'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof HeadlineTagBtn>) => {
  return renderWithProviders(<HeadlineTagBtn {...props} />)[0]
}

describe('HeadlineTagBtn', () => {
  let props: ComponentProps<typeof HeadlineTagBtn>
  const onClickOnDevice = vi.fn()
  const onClickDesktop = vi.fn()
  const mockTag = <div data-testid="mock-tag">Tag</div>

  beforeEach(() => {
    onClickOnDevice.mockReset()
    onClickDesktop.mockReset()

    props = {
      headline: 'Test Headline',
      buttonText: 'Test Button',
      isOnDevice: false,
      onClick: onClickDesktop,
      tag: mockTag,
    }
  })

  it('renders the headline text correctly', () => {
    render(props)

    screen.getByText('Test Headline')
  })

  it('renders the tag when provided', () => {
    render(props)

    screen.getByTestId('mock-tag')
  })

  it('renders the correct button and provides onClick functionality for desktop', () => {
    render(props)

    const button = screen.getByRole('button', { name: 'Test Button' })

    fireEvent.click(button)

    expect(onClickDesktop).toHaveBeenCalledTimes(1)
    expect(onClickOnDevice).not.toHaveBeenCalled()
  })

  it('renders the correct button and provides onClick functionality for ODD', () => {
    render({
      ...props,
      isOnDevice: true,
      onClick: onClickOnDevice,
    })

    const button = screen.getByRole('button', { name: 'Test Button' })

    fireEvent.click(button)

    expect(onClickOnDevice).toHaveBeenCalledTimes(1)
    expect(onClickDesktop).not.toHaveBeenCalled()
  })
})
