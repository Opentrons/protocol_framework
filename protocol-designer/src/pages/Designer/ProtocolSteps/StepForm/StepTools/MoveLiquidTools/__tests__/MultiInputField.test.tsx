import { describe, it, expect, vi, beforeEach } from 'vitest'
import { COLORS } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../../../../../assets/localization'
import { renderWithProviders } from '../../../../../../../__testing-utils__'
import { MultiInputField } from '../MultiInputField'

import type { ComponentProps } from 'react'

const render = (props: ComponentProps<typeof MultiInputField>) => {
  return renderWithProviders(<MultiInputField {...props} />, {
    i18nInstance: i18n,
  })
}

describe('MultiInputField', () => {
  let props: ComponentProps<typeof MultiInputField>

  beforeEach(() => {
    props = {
      name: 'Submerge',
      tooltipContent: 'some tooltip content',
      prefix: 'aspirate',
      fields: [
        {
          fieldTitle: 'submerge speed',
          fieldKey: 'aspirate_submerge_speed',
          units: 'mm/s',
        },
        {
          fieldTitle: 'submerge delay seconds',
          fieldKey: 'aspirate_submerge_delay_seconds',
          units: 'mm',
        },
      ],
      propsForFields: {
        aspirate_submerge_speed: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'aspirate_submerge_speed',
          updateValue: vi.fn(),
          value: null,
        },
        aspirate_submerge_delay_seconds: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'aspirate_submerge_delay_seconds',
          updateValue: vi.fn(),
          value: '',
        },
      },
    }
  })

  it('should render input fields with caption and units wrapped by ListItem', () => {
    render(props)
    screen.getByText('Submerge')
    screen.getByTestId('information_icon')
    const listItem = screen.getByTestId('ListItem_noActive')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.grey20}`)
    screen.getByText('submerge speed')
    screen.getByText('mm/s')
    screen.getByText('submerge delay seconds')
    screen.getByText('mm')
    const inputs = screen.getAllByRole('textbox', { name: '' })
    expect(inputs).toHaveLength(2)
    fireEvent.change(inputs[0], { target: { value: ['5'] } })
    fireEvent.change(inputs[0], { target: { value: ['5'] } })
    expect(
      props.propsForFields.aspirate_submerge_speed.updateValue
    ).toHaveBeenCalled()
    fireEvent.change(inputs[1], { target: { value: ['10'] } })
    expect(
      props.propsForFields.aspirate_submerge_delay_seconds.updateValue
    ).toHaveBeenCalled()
  })

  //   it('should render a well position listbutton when isWellPosition is true', () => {
  //     props.isWellPosition = true
  //     render(props)
  //   })
})
