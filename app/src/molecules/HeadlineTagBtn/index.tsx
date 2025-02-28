import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { SmallButton } from '/app/atoms/buttons'

export interface HeadlineTagBtnProps {
  headline: string
  buttonText: string
  isOnDevice: boolean
  onClick: () => void
  /* An optional Tag component */
  tag?: JSX.Element
}

export function HeadlineTagBtn({
  headline,
  buttonText,
  tag,
  isOnDevice,
  onClick,
}: HeadlineTagBtnProps): JSX.Element {
  return (
    <Flex css={CONTAINER_STYLE}>
      <Flex css={HEADLINE_CONTENT_STYLE}>
        <StyledText
          css={HEADLINE_STYLE}
          oddStyle="level4HeaderSemiBold"
          desktopStyle="bodyLargeSemiBold"
        >
          {headline}
        </StyledText>
        {tag}
      </Flex>
      <Flex css={BTN_CONTAINER_STYLE}>
        {isOnDevice ? (
          <SmallButton onClick={onClick} buttonText={buttonText} />
        ) : (
          <PrimaryButton onClick={onClick}>{buttonText}</PrimaryButton>
        )}
      </Flex>
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  gap: ${SPACING.spacing24};

  @media (max-width: 338px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const HEADLINE_CONTENT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing8};
  flex-grow: 1;
`

const BTN_CONTAINER_STYLE = css`
  @media (max-width: 338px) {
    align-self: ${ALIGN_STRETCH};
  }
`

const HEADLINE_STYLE = css`
  -webkit-line-clamp: 1;
`
