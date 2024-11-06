import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { getTemperatureLabwareOptions } from '../../../../../../ui/modules/selectors'
import {
  DropdownStepFormField,
  ToggleExpandStepFormField,
} from '../../../../../../molecules'
import { getFormErrorsMappedToField, getFormLevelError } from '../../utils'

import type { StepFormProps } from '../../types'

export function TemperatureTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData, visibleFormErrors } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getTemperatureLabwareOptions)

  React.useEffect(() => {
    if (moduleLabwareOptions.length === 1) {
      propsForFields.moduleId.updateValue(moduleLabwareOptions[0].value)
    }
  }, [])

  const mappedErrorsToField = getFormErrorsMappedToField(visibleFormErrors)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <DropdownStepFormField
        {...propsForFields.moduleId}
        options={moduleLabwareOptions}
        title={t('protocol_steps:module')}
      />
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
      <Flex padding={`${SPACING.spacing16} ${SPACING.spacing16} 0`}>
        <ToggleExpandStepFormField
          {...propsForFields.targetTemperature}
          toggleValue={propsForFields.setTemperature.value}
          toggleUpdateValue={propsForFields.setTemperature.updateValue}
          title={t('form:step_edit_form.moduleState')}
          fieldTitle={t('form:step_edit_form.field.temperature.setTemperature')}
          units={t('units.degrees')}
          isSelected={formData.setTemperature === true}
          onLabel={t('form:step_edit_form.field.temperature.toggleOn')}
          offLabel={t('form:step_edit_form.field.temperature.toggleOff')}
          formLevelError={getFormLevelError(
            'targetTemperature',
            mappedErrorsToField
          )}
          caption={t('form:step_edit_form.field.temperature.caption')}
        />
      </Flex>
    </Flex>
  )
}
