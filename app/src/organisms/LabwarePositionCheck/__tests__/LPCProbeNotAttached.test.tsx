import { vi, describe, expect, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { useSelector } from 'react-redux'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { mockLPCContentProps } from '/app/organisms/LabwarePositionCheck/__fixtures__/mockLPCContentProps'
import { LPCProbeNotAttached } from '/app/organisms/LabwarePositionCheck/LPCProbeNotAttached'
import { clickButtonLabeled } from '/app/organisms/LabwarePositionCheck/__tests__/utils'

import type { ComponentProps } from 'react'
import type { Mock } from 'vitest'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof useSelector>()
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof LPCProbeNotAttached>) => {
  return renderWithProviders(<LPCProbeNotAttached {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LPCProbeNotAttached', () => {
  let props: ComponentProps<typeof LPCProbeNotAttached>
  let mockHandleAttachProbeCheck: Mock
  let mockHandleNavToDetachProbe: Mock

  beforeEach(() => {
    mockHandleAttachProbeCheck = vi.fn()
    mockHandleNavToDetachProbe = vi.fn()

    props = {
      ...mockLPCContentProps,
      commandUtils: {
        ...mockLPCContentProps.commandUtils,
        headerCommands: {
          ...mockLPCContentProps.commandUtils.headerCommands,
          handleAttachProbeCheck: mockHandleAttachProbeCheck,
          handleNavToDetachProbe: mockHandleNavToDetachProbe,
        },
      },
    }

    vi.mocked(useSelector).mockReturnValue({
      currentStepIndex: 1,
      totalStepCount: 5,
    })
  })

  it('renders appropriate header content and onClick behavior', () => {
    render(props)

    screen.getByText('Labware Position Check')
    screen.getByText('Try again')
    screen.getByText('Exit')

    clickButtonLabeled('Try again')
    expect(mockHandleAttachProbeCheck).toHaveBeenCalled()

    clickButtonLabeled('Exit')
    expect(mockHandleNavToDetachProbe).toHaveBeenCalled()
  })

  it('renders appropriate body content and alert icon', () => {
    render(props)

    screen.getByText('Calibration probe not detected')
    screen.getByText('Ensure it is properly attached before proceeding.')
  })
})
