import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { InputStepFormField } from '../../../../../../molecules'
import { getFormErrorsMappedToField } from '../../utils'
import type { FieldPropsByName } from '../../types'
import type { StepFormErrors } from '../../../../../../steplist'

interface ReadSettingsProps {
  propsForFields: FieldPropsByName
  visibleFormErrors: StepFormErrors
}

export function ReadSettings(props: ReadSettingsProps): JSX.Element {
  const { propsForFields, visibleFormErrors } = props

  const mappedErrorsToField = getFormErrorsMappedToField(visibleFormErrors)

  const { t } = useTranslation('form')
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingX={SPACING.spacing16}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('export_settings')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('export_detail')}
        </StyledText>
      </Flex>
      <InputStepFormField
        padding="0"
        {...propsForFields.fileName}
        title={t('exported_file_name')}
        errorToShow={mappedErrorsToField.fileName?.title}
      />
    </Flex>
  )
}
