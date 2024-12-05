import { useTranslation } from 'react-i18next'

// ToDo need to add analytics

import type { FallbackProps } from 'react-error-boundary'

import {
  AlertPrimaryButton,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  Modal,
  SPACING,
  StyledText,
} from '@opentrons/components'

export function ProtocolDesignerAppFallback({
  error,
  resetErrorBoundary,
}: FallbackProps): JSX.Element {
  const { t } = useTranslation('shared')

  const handleReloadClick = (): void => {
    resetErrorBoundary()
  }

  return (
    <Modal type="warning" title={t('error_boundary_title')} marginLeft="0">
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('error_boundary_pd_app_description')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {error.message}
          </StyledText>
        </Flex>
        <AlertPrimaryButton
          alignSelf={ALIGN_FLEX_END}
          onClick={handleReloadClick}
        >
          {t('reload_app')}
        </AlertPrimaryButton>
      </Flex>
    </Modal>
  )
}
