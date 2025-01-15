import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { InputStepFormField } from '../../../../../../molecules'
import type { FieldPropsByName } from '../../types'

interface ReadSettingsProps {
  propsForFields: FieldPropsByName
}

export function ReadSettings(props: ReadSettingsProps): JSX.Element {
  const { propsForFields } = props
  const { t } = useTranslation()
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
        {...propsForFields.filePath}
        title={t('exported_file_name')}
      />
    </Flex>
  )
}
