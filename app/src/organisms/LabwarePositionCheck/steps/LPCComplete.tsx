import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  SPACING,
  Flex,
  StyledText,
  ALIGN_CENTER,
} from '@opentrons/components'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import SuccessIcon from '/app/assets/images/icon_success.png'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCComplete(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      buttonText={t('exit')}
      onClickButton={props.commandUtils.headerCommands.handleCloseAndHome}
      contentStyle={CHILDREN_CONTAINER_STYLE}
    >
      <Flex css={CONTENT_CONTAINER}>
        <img src={SuccessIcon} alt="Success Icon" />
        <StyledText oddStyle="level3HeaderBold">{t('lpc_complete')}</StyledText>
      </Flex>
    </LPCContentContainer>
  )
}

// The design system makes a padding exception for this view.
const CHILDREN_CONTAINER_STYLE = css`
  margin-top: 7.75rem;
  flex-direction: ${DIRECTION_COLUMN};
  height: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: 0 ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60};
    gap: ${SPACING.spacing40};
  }
`

const CONTENT_CONTAINER = css`
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  padding: ${SPACING.spacing40};
  gap: ${SPACING.spacing24};
`
