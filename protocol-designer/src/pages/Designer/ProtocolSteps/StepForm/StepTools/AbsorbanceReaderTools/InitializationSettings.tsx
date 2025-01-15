import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  ListItem,
  StyledText,
  InfoScreen,
} from '@opentrons/components'
import type { Initialization } from '../../../../../../step-forms/types'

interface InitializationSettingsProps {
  initialization: Initialization | null
}

export function InitializationSettings(
  props: InitializationSettingsProps
): JSX.Element {
  const { initialization } = props
  const { t } = useTranslation('form')
  const content =
    initialization == null ? (
      <InfoScreen height="12.75rem" content={t('no_settings_defined')} />
    ) : (
      initialization.wavelengths.map(wavelength => (
        <ListItem
          type="noActive"
          key={`listItem_${wavelength}`}
          padding={SPACING.spacing12}
        >
          <StyledText desktopStyle="bodyDefaultRegular">{`${wavelength} ${t(
            'application:units.nanometer'
          )}`}</StyledText>
        </ListItem>
      ))
    )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('current_initialization_settings')}
      </StyledText>
      {content}
    </Flex>
  )
}
