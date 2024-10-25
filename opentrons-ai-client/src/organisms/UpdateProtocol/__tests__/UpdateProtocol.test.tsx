import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import type { NavigateFunction } from 'react-router-dom'

import { UpdateProtocol } from '../index'
import { i18n } from '../../../i18n'

const mockNavigate = vi.fn()
const mockUseTrackEvent = vi.fn()
const mockUseChatData = vi.fn()

vi.mock('../../../resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

vi.mock('../../../resources/chatDataAtom', () => ({
  chatDataAtom: () => mockUseChatData,
}))

vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

const render = () => {
  return renderWithProviders(<UpdateProtocol />, {
    i18nInstance: i18n,
  })
}

describe('Update Protocol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render', () => {
    render()
    expect(screen.getByText('Update an existing protocol')).toBeInTheDocument()
    expect(screen.getByText('Choose file')).toBeInTheDocument()
    expect(screen.getByText('Protocol file')).toBeInTheDocument()
    expect(screen.getByText('Choose file')).toBeInTheDocument()
    expect(screen.getByText('Type of update')).toBeInTheDocument()
    expect(screen.getByText('Select an option')).toBeInTheDocument()
    expect(
      screen.getByText('Provide details of changes you want to make')
    ).toBeInTheDocument()
  })

  it.skip('should update the file value when the file is uploaded', async () => {
    render()

    const blobParts: BlobPart[] = [
      'x = 1\n',
      'x = 2\n',
      'x = 3\n',
      'x = 4\n',
      'print("x is 1.")\n',
    ]

    const file = new File(blobParts, 'test-file.py', { type: 'text/python' })

    fireEvent.drop(screen.getByTestId('file_drop_zone'), {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('test-file.py')).toBeInTheDocument()
    })
  })

  it.skip('should have the submit prompt button disabled when the progress percentage is not 1.0', () => {
    render()
    expect(screen.getByText('Submit prompt')).toBeDisabled()
  })

  it.skip('should call navigate to the chat page when the submit prompt button is clicked', () => {
    render()
    const submitPromptButton = screen.getByText('Submit prompt')
    submitPromptButton.click()
    expect(mockNavigate).toHaveBeenCalledWith('/chat')
  })
})
