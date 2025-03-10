import { describe, expect, it, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { useDispatch } from 'react-redux'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockLPCContentProps } from '/app/organisms/LabwarePositionCheck/__fixtures__'
import { LPCLabwareDetails } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/LPCLabwareDetails'
import { InlineNotification } from '/app/atoms/InlineNotification'
import {
  selectSelectedLwOverview,
  selectSelectedLwDisplayName,
  selectWorkingOffsetsByUri,
  selectIsDefaultOffsetAbsent,
  selectStepInfo,
  goBackEditOffsetSubstep,
  applyWorkingOffsets,
} from '/app/redux/protocol-runs'
import { handleUnsavedOffsetsModal } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/UnsavedOffsetsModal'

import type { ComponentProps } from 'react'
import type { Mock } from 'vitest'

vi.mock(
  '/app/organisms/LabwarePositionCheck/steps/HandleLabware/LPCLabwareDetails/DefaultLocationOffset',
  () => ({
    DefaultLocationOffset: () => <div>MOCK_DEFAULT_LOCATION_OFFSET</div>,
  })
)
vi.mock(
  '/app/organisms/LabwarePositionCheck/steps/HandleLabware/LPCLabwareDetails/LocationSpecificOffsetsContainer',
  () => ({
    LocationSpecificOffsetsContainer: () => (
      <div>MOCK_LOCATION_SPECIFIC_OFFSETS_CONTAINER</div>
    ),
  })
)
vi.mock('/app/atoms/InlineNotification', () => ({
  InlineNotification: vi.fn(({ type, heading, message }) => (
    <div
      data-testid="inline-notification"
      data-type={type}
      data-heading={heading}
    >
      {message}
    </div>
  )),
}))
vi.mock(
  '/app/organisms/LabwarePositionCheck/steps/HandleLabware/UnsavedOffsetsModal',
  () => ({
    handleUnsavedOffsetsModal: vi.fn(),
  })
)
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: vi.fn(),
  }
})
vi.mock('/app/redux/protocol-runs', () => ({
  selectSelectedLwOverview: vi.fn(),
  selectSelectedLwDisplayName: vi.fn(),
  selectWorkingOffsetsByUri: vi.fn(),
  selectIsDefaultOffsetAbsent: vi.fn(),
  selectStepInfo: vi.fn(),
  goBackEditOffsetSubstep: vi.fn(),
  applyWorkingOffsets: vi.fn(),
}))

const render = (props: ComponentProps<typeof LPCLabwareDetails>) => {
  const mockState = {
    [props.runId]: {
      steps: {
        currentStepIndex: 2,
        totalStepCount: 5,
        protocolName: 'MOCK_PROTOCOL',
      },
    },
  }

  return renderWithProviders(<LPCLabwareDetails {...props} />, {
    i18nInstance: i18n,
    initialState: mockState,
  })[0]
}

describe('LPCLabwareDetails', () => {
  let props: ComponentProps<typeof LPCLabwareDetails>
  let mockDispatch: Mock

  beforeEach(() => {
    mockDispatch = vi.fn()
    vi.mocked(useDispatch).mockReturnValue(mockDispatch)

    props = {
      ...mockLPCContentProps,
    }

    vi.mocked(InlineNotification).mockClear()
    vi.mocked(handleUnsavedOffsetsModal).mockClear()

    vi.mocked(
      selectStepInfo
    ).mockImplementation((runId: string) => (state: any) => state[runId]?.steps)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () => ({
      uri: 'labware-uri-1',
      id: 'labware-1',
      offsetLocationDetails: null,
    }))
    vi.mocked(selectSelectedLwDisplayName).mockImplementation(() => () =>
      'Test Labware'
    )
    vi.mocked(selectWorkingOffsetsByUri).mockImplementation(() => () => ({}))
    vi.mocked(selectIsDefaultOffsetAbsent).mockImplementation(() => () => false)
    vi.mocked(goBackEditOffsetSubstep).mockReturnValue({
      type: 'GO_BACK_HANDLE_LW_SUBSTEP',
    } as any)
    vi.mocked(applyWorkingOffsets).mockReturnValue({
      type: 'APPLY_WORKING_OFFSETS',
    } as any)
  })

  it('renders the mocked child components', () => {
    render(props)

    screen.getByText('MOCK_DEFAULT_LOCATION_OFFSET')
    screen.getByText('MOCK_LOCATION_SPECIFIC_OFFSETS_CONTAINER')
  })

  it('displays the selected labware name as the header', () => {
    render(props)

    screen.getByText('Test Labware')
  })

  it('shows InlineNotification when default offset is absent', () => {
    // Set the default offset to be absent
    vi.mocked(selectIsDefaultOffsetAbsent).mockImplementation(() => () => true)

    render(props)

    const notification = screen.getByTestId('inline-notification')
    expect(notification).toBeInTheDocument()
    expect(notification.getAttribute('data-type')).toBe('alert')
    expect(notification.getAttribute('data-heading')).toBe(
      'Add a default offset to automatically apply it to all placements of this labware on the deck'
    )
    expect(notification.textContent).toBe(
      'Specific slot locations can be adjusted as needed'
    )
  })

  it('does not show InlineNotification when default offset is present', () => {
    render(props)

    expect(screen.queryByTestId('inline-notification')).not.toBeInTheDocument()
  })

  it('disables save button when no working offsets exist', () => {
    render(props)

    const saveButton = screen.getByRole('button', { name: 'Save' })

    expect(saveButton).toHaveAttribute('disabled')
  })

  it('enables save button when working offsets exist', () => {
    vi.mocked(selectWorkingOffsetsByUri).mockImplementation(() => () =>
      ({
        'labware-uri-1': true,
      } as any)
    )

    render(props)

    const saveButton = screen.getByRole('button', { name: 'Save' })

    expect(saveButton).not.toHaveAttribute('disabled')
  })

  it('shows unsaved changes modal when back is clicked with working offsets', () => {
    vi.mocked(selectWorkingOffsetsByUri).mockImplementation(() => () =>
      ({
        'labware-uri-1': true,
      } as any)
    )

    render(props)

    const backButton = screen.getByTestId('ChildNavigation_Back_Button')
    backButton.click()

    expect(handleUnsavedOffsetsModal).toHaveBeenCalledWith(props)
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('goes back directly when back is clicked with no working offsets', () => {
    render(props)

    const backButton = screen.getByTestId('ChildNavigation_Back_Button')
    backButton.click()

    expect(handleUnsavedOffsetsModal).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'GO_BACK_HANDLE_LW_SUBSTEP',
      })
    )
  })

  it('dispatches actions when save is clicked with working offsets', () => {
    vi.mocked(selectWorkingOffsetsByUri).mockImplementation(() => () =>
      ({
        'labware-uri-1': true,
      } as any)
    )

    render(props)

    const saveButton = screen.getByText('Save')
    saveButton.click()

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    expect(applyWorkingOffsets).toHaveBeenCalledWith(
      props.runId,
      'labware-uri-1'
    )
    expect(goBackEditOffsetSubstep).toHaveBeenCalledWith(props.runId)
  })
})
