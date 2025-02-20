import { css } from 'styled-components'
import { StyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Flex, Link } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  TEXT_DECORATION_UNDERLINE,
} from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { getYearFromDate } from './util'

const PRIVACY_POLICY_URL = 'https://opentrons.com/privacy-policy'
const EULA_URL = 'https://opentrons.com/eula'

export function EndUserAgreementFooter(): JSX.Element {
  return (
    <Flex
      backgroundColor={COLORS.grey10}
      padding={SPACING.spacing24}
      width="100%"
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
    >
      <StyledText desktopStyle="captionRegular">
        By continuing, you agree to the Opentrons{' '}
        <Link
          external
          href={PRIVACY_POLICY_URL}
          color={COLORS.black90}
          textDecoration={TEXT_DECORATION_UNDERLINE}
          css={LINK_BUTTON_STYLE}
        >
          Privacy policy
        </Link>{' '}
        and{' '}
        <Link
          external
          href={EULA_URL}
          color={COLORS.black90}
          textDecoration={TEXT_DECORATION_UNDERLINE}
          css={LINK_BUTTON_STYLE}
        >
          End user license agreement
        </Link>
      </StyledText>
      <StyledText desktopStyle="captionRegular">
        {`Copyright © ${getYearFromDate()} Opentrons`}
      </StyledText>
    </Flex>
  )
}

const LINK_BUTTON_STYLE = css`
  color: ${COLORS.black90};

  &:hover {
    color: ${COLORS.blue50};
  }

  &:focus-visible {
    color: ${COLORS.blue50};
    outline: 2px solid ${COLORS.blue50};
    outline-offset: 0.25rem;
  }

  &:disabled {
    color: ${COLORS.grey40};
  }
`
