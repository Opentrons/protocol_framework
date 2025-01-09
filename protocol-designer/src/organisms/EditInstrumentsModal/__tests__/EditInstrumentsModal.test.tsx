import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'

import { getRobotType } from '../../../file-data/selectors'
import { usePipetteConfig } from '../usePipetteConfig'
import { PipetteOverview } from '../PipetteOverview'
import { PipetteConfiguration } from '../PipetteConfiguration'

import { EditInstrumentsModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('../../../file-data/selectors')
vi.mock('../usePipetteConfig')
vi.mock('../PipetteOverview')
vi.mock('../PipetteConfiguration')

const mockOnClose = vi.fn()

const render = (props: ComponentProps<typeof EditInstrumentsModal>) => {
  return renderWithProviders(<EditInstrumentsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EditInstrumentsModal', () => {
  let props: ComponentProps<typeof EditInstrumentsModal>

  beforeEach(() => {
    props = {
      onClose: mockOnClose,
    }
    vi.mocked(getRobotType).mockReturnValue(FLEX_ROBOT_TYPE)
    vi.mocked(usePipetteConfig).mockReturnValue({
      page: 'add',
      mount: 'left',
      pipetteType: '96',
      pipetteGen: 'flex',
      pipetteVolume: 'p1000',
      selectedTips: ['A1'],
      setPage: vi.fn(),
      setMount: vi.fn(),
      setPipetteType: vi.fn(),
      setPipetteGen: vi.fn(),
      setPipetteVolume: vi.fn(),
      setSelectedTips: vi.fn(),
      resetFields: vi.fn(),
    })
    vi.mocked(PipetteOverview).mockReturnValue(<div>mock PipetteOverview</div>)
    vi.mocked(PipetteConfiguration).mockReturnValue(
      <div>mock PipetteConfiguration</div>
    )
  })

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Edit Instruments')
    screen.getByText('Save')
    screen.getByText('Cancel')
  })
})
