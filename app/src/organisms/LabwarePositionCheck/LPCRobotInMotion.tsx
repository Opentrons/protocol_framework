import styled, { css } from 'styled-components'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  RESPONSIVENESS,
  SIZE_4,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import { useTranslation } from 'react-i18next'

interface RobotMotionLoaderProps extends LPCWizardContentProps {
  header?: string
  body?: string
}

export function LPCRobotInMotion(props: RobotMotionLoaderProps): JSX.Element {
  const { header, body } = props
  const { t } = useTranslation('labware_position_check')

  return (
    <LPCContentContainer {...props} header={t('labware_position_check_title')}>
      <Flex css={CONTAINER_STYLE}>
        <Icon name="ot-spinner" spin size={SIZE_4} color={COLORS.grey50} />
        {header != null ? <LoadingText>{header}</LoadingText> : null}
        {body != null ? (
          <LegacyStyledText as="p">{body}</LegacyStyledText>
        ) : null}
      </Flex>
    </LPCContentContainer>
  )
}

const LoadingText = styled.h1`
  ${TYPOGRAPHY.h1Default}

  p {
    text-transform: lowercase;
  }

  p::first-letter {
    text-transform: uppercase;
  }

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  min-height: 29.5rem;
  grid-gap: ${SPACING.spacing24};
`
