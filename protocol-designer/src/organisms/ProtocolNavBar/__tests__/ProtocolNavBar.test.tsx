import { screen } from '@testing-library/react'
import { describe, it, beforeEach, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { getFileMetadata } from '../../../file-data/selectors'
import { LiquidButton } from '../LiquidButton'

import { ProtocolNavBar } from '..'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { TabProps } from '@opentrons/components'

vi.mock('../../../file-data/selectors')
vi.mock('../LiquidButton')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const reactRouterDom = await importOriginal<NavigateFunction>()
  return {
    ...reactRouterDom,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof ProtocolNavBar>) => {
  return renderWithProviders(<ProtocolNavBar {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolNavBar', () => {
  let props: ComponentProps<typeof ProtocolNavBar>
  beforeEach(() => {
    props = {
      hasZoomInSlot: false,
      tabs: [
        {
          text: 'Protocol starting deck',
          isActive: true,
        },
        {
          text: 'Protocol steps',
          isActive: false,
        },
      ] as TabProps[],
      hasTrashEntity: false,
      showLiquidOverflowMenu: vi.fn(),
      isAddingHardwareOrLabware: false,
    }
    vi.mocked(getFileMetadata).mockReturnValue({
      protocolName: 'mockProtocolName',
      created: 123,
    })
    vi.mocked(LiquidButton).mockReturnValue(<div>mock LiquidButton</div>)
  })

  it('should render protocol name and edit protocol - protocol name', () => {
    render(props)
    screen.getByText('mockProtocolName')
    screen.getByText('Edit protocol')
    screen.getByText('mock LiquidButton')
    screen.getByText('Protocol starting deck')
    screen.getByText('Protocol steps')
    screen.getByText('Done')
  })
  it('should render protocol name and edit protocol - no protocol name', () => {
    vi.mocked(getFileMetadata).mockReturnValue({})
    render(props)
    screen.getByText('Untitled protocol')
    screen.getByText('Edit protocol')
  })

  it('should render protocol name and add hardware/labware - protocol name', () => {
    props = { ...props, isAddingHardwareOrLabware: true }
    render(props)
    screen.getByText('mockProtocolName')
    screen.getByText('Add hardware/labware')
  })

  it('should render protocol name and add hardware/labware - no protocol name', () => {
    props = { ...props, isAddingHardwareOrLabware: true }
    vi.mocked(getFileMetadata).mockReturnValue({})
    render(props)
    screen.getByText('Untitled protocol')
    screen.getByText('Add hardware/labware')
  })
})
