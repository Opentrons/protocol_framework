import { describe, it, expect, vi, beforeEach } from 'vitest'
import { COLORS } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../../../../../assets/localization'
import { renderWithProviders } from '../../../../../../../__testing-utils__'
import { PositionField } from '../../../PipetteFields'
import { MultiInputField } from '../MultiInputField'

import type { ComponentProps } from 'react'

vi.mock('../../../PipetteFields')

const render = (props: ComponentProps<typeof MultiInputField>) => {
  return renderWithProviders(<MultiInputField {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MultiInputField', () => {
  let props: ComponentProps<typeof MultiInputField>

  beforeEach(() => {
    props = {
      name: 'Retract',
      tooltipContent: 'some tooltip content',
      prefix: 'aspirate_retract',
      fields: [
        {
          fieldTitle: 'retract speed',
          fieldKey: 'aspirate_retract_speed',
          units: 'mm/s',
        },
        {
          fieldTitle: 'retract delay seconds',
          fieldKey: 'aspirate_retract_delay_seconds',
          units: 'mm',
        },
      ],
      propsForFields: {
        aspirate_retract_speed: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'aspirate_retract_speed',
          updateValue: vi.fn(),
          value: null,
        },
        aspirate_retract_delay_seconds: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'aspirate_retract_delay_seconds',
          updateValue: vi.fn(),
          value: '',
        },
      },
    }
    vi.mocked(PositionField).mockReturnValue(<div>mock PositionField</div>)
  })

  it('should render input fields with caption and units wrapped by ListItem', () => {
    render(props)
    screen.getByText('Retract')
    screen.getByTestId('information_icon')
    const listItem = screen.getByTestId('ListItem_noActive')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.grey20}`)
    screen.getByText('retract speed')
    screen.getByText('mm/s')
    screen.getByText('retract delay seconds')
    screen.getByText('mm')
    const inputs = screen.getAllByRole('textbox', { name: '' })
    expect(inputs).toHaveLength(2)
    fireEvent.change(inputs[0], { target: { value: ['5'] } })
    fireEvent.change(inputs[0], { target: { value: ['5'] } })
    expect(
      props.propsForFields.aspirate_retract_speed.updateValue
    ).toHaveBeenCalled()
    fireEvent.change(inputs[1], { target: { value: ['10'] } })
    expect(
      props.propsForFields.aspirate_retract_delay_seconds.updateValue
    ).toHaveBeenCalled()
  })

  it('should render a well position component when isWellPosition is true', () => {
    props.isWellPosition = true
    props.labwareId = 'mockID'
    render(props)
    screen.getByText('mock PositionField')
  })
})
