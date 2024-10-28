import { useState } from 'react'
import round from 'lodash/round'
import { useTranslation } from 'react-i18next'
import { InputField } from '@opentrons/components'
import type { ChangeEvent } from 'react'
import type { FieldProps } from '../types'
import { InputStepFormField } from '../../../../../molecules'

const DECIMALS_ALLOWED = 1

export interface FlowRateInputProps extends FieldProps {
  flowRateType: 'aspirate' | 'dispense' | 'blowout'
  minFlowRate: number
  maxFlowRate: number
  defaultFlowRate?: number | null
}

export function FlowRateInput(props: FlowRateInputProps): JSX.Element {
  const {
    defaultFlowRate,

    flowRateType,
    maxFlowRate,
    minFlowRate,

    value,
    ...restProps
  } = props
  const { t, i18n } = useTranslation(['form', 'application', 'protocol_steps'])

  const [isPristine, setIsPristine] = useState<boolean>(true)

  //   const handleChangeNumber = (e: ChangeEvent<HTMLInputElement>): void => {
  //     setIsPristine(false)
  //     const value = e.target.value
  //     updateValue(value)
  //   }
  const title = i18n.format(
    t('protocol_steps:flow_type_title', { type: flowRateType }),
    'capitalize'
  )

  // show 0.1 not 0 as minimum, since bottom of range is non-inclusive
  const displayMinFlowRate = minFlowRate || Math.pow(10, -DECIMALS_ALLOWED)

  const numValue = Number(value)
  const outOfBounds =
    numValue === 0 || minFlowRate > numValue || numValue > maxFlowRate
  const correctDecimals = round(numValue, DECIMALS_ALLOWED) === numValue

  let errorMessage: string | null = null
  if (!correctDecimals) {
    errorMessage = t('step_edit_form.field.flow_rate.error_decimals', {
      decimals: `${DECIMALS_ALLOWED}`,
    })
  } else if (outOfBounds) {
    errorMessage = t('step_edit_form.field.flow_rate.error_out_of_bounds', {
      min: displayMinFlowRate,
      max: maxFlowRate,
    })
  }
  console.log(errorMessage)
  return (
    <InputStepFormField
      title={title}
      errorToShow={errorMessage}
      {...restProps}
      units={t('application:units.microliterPerSec')}
      value={value ? String(value) : defaultFlowRate}
      caption={t('protocol_steps:valid_range', {
        min: displayMinFlowRate,
        max: maxFlowRate,
        unit: t('application:units.microliterPerSec'),
      })}
    />
  )
}
