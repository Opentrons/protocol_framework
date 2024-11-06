import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
} from '@opentrons/components'
import {
  getTemperatureLabwareOptions,
  getTemperatureModuleIds,
} from '../../../../../../ui/modules/selectors'
import {
  DropdownStepFormField,
  InputStepFormField,
} from '../../../../../../molecules'
import type { ChangeEvent } from 'react'
import type { StepFormProps } from '../../types'

export function TemperatureTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getTemperatureLabwareOptions)
  const temperatureModuleIds = useSelector(getTemperatureModuleIds)
  const { setTemperature, moduleId } = formData

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <DropdownStepFormField
        {...propsForFields.moduleId}
        options={moduleLabwareOptions}
        title={t('protocol_steps:module')}
      />
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
      {temperatureModuleIds != null
        ? temperatureModuleIds.map(id =>
            id === moduleId ? (
              <Flex
                key={id}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
              >
                <Flex padding={`${SPACING.spacing16} ${SPACING.spacing16} 0`}>
                  <RadioButton
                    width="100%"
                    largeDesktopBorderRadius
                    onChange={(e: ChangeEvent<any>) => {
                      propsForFields.setTemperature.updateValue(
                        e.currentTarget.value
                      )
                    }}
                    buttonLabel={t(
                      'form:step_edit_form.field.setTemperature.options.true'
                    )}
                    buttonValue="true"
                    isSelected={propsForFields.setTemperature.value === 'true'}
                  />
                </Flex>
                {setTemperature === 'true' && (
                  <InputStepFormField
                    {...propsForFields.targetTemperature}
                    title={'Temperature'}
                    units={t('units.degrees')}
                  />
                )}
                <Flex padding={`0 ${SPACING.spacing16}`} width="100%">
                  <RadioButton
                    width="100%"
                    largeDesktopBorderRadius
                    onChange={(e: ChangeEvent<any>) => {
                      propsForFields.setTemperature.updateValue(
                        e.currentTarget.value
                      )
                    }}
                    buttonLabel={t(
                      'form:step_edit_form.field.setTemperature.options.false'
                    )}
                    buttonValue="false"
                    isSelected={propsForFields.setTemperature.value === 'false'}
                  />
                </Flex>
              </Flex>
            ) : null
          )
        : null}
    </Flex>
  )
}
