import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getHeaterShakerLabwareOptions } from '../../../../../../ui/modules/selectors'
import {
  DropdownStepFormField,
  ToggleExpandStepFormField,
  ToggleStepFormField,
} from '../../../../../../molecules'
import { getFormErrorsMappedToField, getFormLevelError } from '../../utils'
import type { StepFormProps } from '../../types'

export function HeaterShakerTools(props: StepFormProps): JSX.Element {
  const {
    propsForFields,
    formData,
    showFormErrors = false,
    focusedField = null,
    visibleFormErrors,
  } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)

  const mappedErrorsToField = getFormErrorsMappedToField(visibleFormErrors)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <DropdownStepFormField
        {...propsForFields.moduleId}
        options={moduleLabwareOptions}
        title={t('protocol_steps:module')}
      />
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing12}
        gridGap={SPACING.spacing8}
      >
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('protocol_steps:heater_shaker_settings')}
        </StyledText>
        <ToggleExpandStepFormField
          {...propsForFields.targetHeaterShakerTemperature}
          toggleValue={propsForFields.setHeaterShakerTemperature.value}
          toggleUpdateValue={
            propsForFields.setHeaterShakerTemperature.updateValue
          }
          title={t(
            'form:step_edit_form.field.heaterShaker.temperature.setTemperature'
          )}
          fieldTitle={t('protocol_steps:temperature')}
          isSelected={formData.setHeaterShakerTemperature === true}
          units={t('units.degrees')}
          onLabel={t(
            'form:step_edit_form.field.heaterShaker.temperature.toggleOn'
          )}
          offLabel={t(
            'form:step_edit_form.field.heaterShaker.temperature.toggleOff'
          )}
          formLevelError={getFormLevelError(
            showFormErrors,
            'targetHeaterShakerTemperature',
            mappedErrorsToField,
            focusedField
          )}
        />
        <ToggleExpandStepFormField
          {...propsForFields.targetSpeed}
          toggleValue={propsForFields.setShake.value}
          toggleUpdateValue={propsForFields.setShake.updateValue}
          title={t('form:step_edit_form.field.heaterShaker.shaker.setShake')}
          fieldTitle={t('protocol_steps:speed')}
          isSelected={formData.setShake === true}
          units={t('units.rpm')}
          onLabel={t('form:step_edit_form.field.heaterShaker.shaker.toggleOn')}
          offLabel={t(
            'form:step_edit_form.field.heaterShaker.shaker.toggleOff'
          )}
          formLevelError={getFormLevelError(
            showFormErrors,
            'targetSpeed',
            mappedErrorsToField,
            focusedField
          )}
        />
        <ToggleStepFormField
          isDisabled={propsForFields.latchOpen.disabled}
          title={t('form:step_edit_form.field.heaterShaker.latch.setLatch')}
          isSelected={propsForFields.latchOpen.value === true}
          onLabel={t('form:step_edit_form.field.heaterShaker.latch.toggleOn')}
          offLabel={t('form:step_edit_form.field.heaterShaker.latch.toggleOff')}
          toggleUpdateValue={propsForFields.latchOpen.updateValue}
          toggleValue={propsForFields.latchOpen.value}
          tooltipContent={
            propsForFields.latchOpen.disabled
              ? propsForFields.latchOpen.tooltipContent ?? null
              : null
          }
        />
        <ToggleExpandStepFormField
          {...propsForFields.heaterShakerTimer}
          toggleValue={propsForFields.heaterShakerSetTimer.value}
          toggleUpdateValue={propsForFields.heaterShakerSetTimer.updateValue}
          title={t(
            'form:step_edit_form.field.heaterShaker.timer.heaterShakerSetTimer'
          )}
          fieldTitle={t('form:step_edit_form.field.heaterShaker.duration')}
          isSelected={formData.heaterShakerSetTimer === true}
          units={t('application:units.time')}
          toggleElement="checkbox"
          formLevelError={getFormLevelError(
            showFormErrors,
            'heaterShakerTimer',
            mappedErrorsToField,
            focusedField
          )}
        />
      </Flex>
    </Flex>
  )
}
