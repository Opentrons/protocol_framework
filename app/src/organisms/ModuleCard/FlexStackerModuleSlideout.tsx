import { useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { SPACING, LegacyStyledText, TYPOGRAPHY } from '@opentrons/components'
import { Slideout } from '/app/atoms/Slideout'

import type { FlexStackerModule } from '/app/redux/modules/types'

interface FlexStackerModuleSlideoutProps {
  module: FlexStackerModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const FlexStackerModuleSlideout = (
  props: FlexStackerModuleSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation('device_details')
  const moduleName = getModuleDisplayName(module.moduleModel)

  const handleCloseSlideout = (): void => {
    onCloseClick()
  }

  return (
    <Slideout
      title={t('absorbance_reader', {
        name: moduleName,
      })}
      onCloseClick={handleCloseSlideout}
      isExpanded={isExpanded}
    >
      <LegacyStyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing4}
        data-testid={`FlexStackerModuleSlideout_title_${module.serialNumber}`}
      >
        {t('set_absorbance_reader')}
      </LegacyStyledText>
    </Slideout>
  )
}
