import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { i18n } from '../../../../assets/localization'
import { renderWithProviders } from '../../../../__testing-utils__'
import { TimelineToolbox } from '../Timeline'
import { DraggableSidebar } from '../DraggableSidebar'

import type { ComponentProps } from 'react'

vi.mock('../Timeline')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../ui/steps/selectors')
// vi.mock('../Timeline', async importOriginal => {
//   const actual = await importOriginal<typeof TimelineToolbox>()
//   return {
//     ...actual,
//     TimelineToolbox: () => <div>mock TimelineToolbox</div>,
//   }
// })

const mockSetTargetWidth = vi.fn()

const render = (props: ComponentProps<typeof DraggableSidebar>) => {
  return renderWithProviders(<DraggableSidebar {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DraggableSidebar', () => {
  let props: ComponentProps<typeof DraggableSidebar>
  beforeEach(() => {
    props = {
      setTargetWidth: mockSetTargetWidth,
    }
    vi.mocked(TimelineToolbox).mockReturnValue(<div>mock TimelineToolbox</div>)
  })

  it('renders mock TimelineToolbox', () => {
    render(props)
    screen.getByText('mock TimelineToolbox')
  })
})
