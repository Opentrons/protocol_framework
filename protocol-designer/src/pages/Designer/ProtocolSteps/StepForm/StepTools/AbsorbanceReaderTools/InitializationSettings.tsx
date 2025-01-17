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

const KNOWN_WAVELENGTHS_TO_COLOR: Record<number, string> = {
  450: 'Blue',
  562: 'Green',
  600: 'Orange',
  650: 'Red',
}

const getWavelengthDisplay = (
  wavelength: number,
  knownColor: string | null,
  isReference: boolean,
  t: any
): string => {
  if (isReference) {
    return `${wavelength} ${t('application:units.nanometer')} ${
      knownColor != null
        ? t(
            'form:step_edit_form.absorbanceReader.reference_wavelength_color_parentheses',
            { color: knownColor }
          )
        : t(
            'form:step_edit_form.absorbanceReader.reference_wavelength_parentheses'
          )
    }`
  }
  return `${wavelength} ${t('application:units.nanometer')} ${
    knownColor != null
      ? t('form:step_edit_form.absorbanceReader.color_parentheses', {
          color: knownColor,
        })
      : ''
  }`
}

interface InitializationSettingsProps {
  initialization: Initialization | null
}

export function InitializationSettings(
  props: InitializationSettingsProps
): JSX.Element {
  const { initialization } = props
  const { t } = useTranslation(['application', 'form'])
  const content =
    initialization == null ? (
      <InfoScreen
        height="12.75rem"
        content={t('form:step_edit_form.absorbanceReader.no_settings_defined')}
      />
    ) : (
      <>
        {initialization.wavelengths.map(wavelength => {
          const knownColor = KNOWN_WAVELENGTHS_TO_COLOR[wavelength]
          return (
            <ListItem
              type="noActive"
              key={`listItem_${wavelength}`}
              padding={SPACING.spacing12}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {getWavelengthDisplay(wavelength, knownColor, false, t)}
              </StyledText>
            </ListItem>
          )
        })}
        {initialization.referenceWavelength != null ? (
          <ListItem
            type="noActive"
            key={`listItem_${initialization.referenceWavelength}`}
            padding={SPACING.spacing12}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {getWavelengthDisplay(
                initialization.referenceWavelength,
                KNOWN_WAVELENGTHS_TO_COLOR[initialization.referenceWavelength],
                true,
                t
              )}
            </StyledText>
          </ListItem>
        ) : null}
      </>
    )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t(
          'form:step_edit_form.absorbanceReader.current_initialization_settings'
        )}
      </StyledText>
      {content}
    </Flex>
  )
}
