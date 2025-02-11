import { SingleStepMoveLiquidTools } from './SingleStepMoveLiquidTools'
import { MultipleStepsMoveLiquidTools } from './MultipleStepsMoveLiquidTools'

import type { StepFormProps } from '../../types'

export function MoveLiquidTools(props: StepFormProps): JSX.Element {
  const {
    toolboxStep,
    propsForFields,
    formData,
    visibleFormErrors,
    setShowFormErrors,
    tab,
    setTab,
  } = props

  const getFields = (type: 'submerge' | 'retract'): StepInputFieldProps[] => {
    return [
      {
        fieldTitle: t(`protocol_steps:${type}_speed`),
        fieldKey: `${tab}_${type}_speed`,
        units: 'application:units.millimeterPerSec',
        errorToShow: getFormLevelError(
          `${tab}_${type}_speed`,
          mappedErrorsToField
        ),
      },
      {
        fieldTitle: t('protocol_steps:delay_duration'),
        fieldKey: `${tab}_${type}_delay_seconds`,
        units: 'application:units.seconds',
        errorToShow: getFormLevelError(
          `${tab}_${type}_delay_seconds`,
          mappedErrorsToField
        ),
      },
    ]
  }

  return toolboxStep === 0 ? (
    <SingleStepMoveLiquidTools
      propsForFields={propsForFields}
      formData={formData}
      visibleFormErrors={visibleFormErrors}
    />
  ) : (
    <MultipleStepsMoveLiquidTools
      propsForFields={propsForFields}
      formData={formData}
      tab={tab}
      setTab={setTab}
      setShowFormErrors={setShowFormErrors}
      visibleFormErrors={visibleFormErrors}
    />
  )
}
