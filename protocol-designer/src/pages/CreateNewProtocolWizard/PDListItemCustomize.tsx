import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  // ALIGN_FLEX_END,
  // JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  Flex,
  Link,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  COLORS,
  DropdownMenu,
  Tag,
} from '@opentrons/components'

import { useResponsiveBreakpoints } from '../../resources/useResponsiveBreakpoints'

import type { DropdownMenuProps, TagProps } from '@opentrons/components'

// This component is a temporary solution to the problem of having a list item with a dropdown menu
interface PDListItemCustomizeProps {
  header: string
  //  this is either an image or an icon
  leftHeaderItem?: JSX.Element
  onClick?: () => void
  linkText?: string
  //  these are the middle prop options
  label?: string
  dropdown?: DropdownMenuProps
  tag?: TagProps
  /** temporary prop for dropdown menu  */
  forceDirection?: boolean
}

export function PDListItemCustomize(
  props: PDListItemCustomizeProps
): JSX.Element {
  const {
    header,
    leftHeaderItem,
    onClick,
    label,
    linkText,
    dropdown,
    tag,
    forceDirection = false,
  } = props
  return (
    <Flex
      width="100%"
      alignItems={ALIGN_CENTER}
      padding={SPACING.spacing12}
      gridGap={SPACING.spacing16}
    >
      <Flex
        gridGap={SPACING.spacing16}
        alignItems={ALIGN_CENTER}
        id="1"
        css={css`
          outline: 1px solid red;
        `}
        flex="0 0 16.6875rem"
      >
        {leftHeaderItem != null ? (
          <Flex size="3.75rem">{leftHeaderItem}</Flex>
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{header}</StyledText>
      </Flex>
      <Flex
        // width={onClick != null && linkText != null ? '40%' : '50%'}
        flex="0 0 16.6875rem"
        gridGap={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        id="2"
        css={css`
          outline: 1px solid red;
        `}
      >
        {label != null ? (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        ) : null}
        {dropdown != null ? (
          <DropdownMenu {...dropdown} forceDirection={forceDirection} />
        ) : null}
        {tag != null ? <Tag {...tag} /> : null}
      </Flex>
      {onClick != null && linkText != null ? (
        <Flex flex="0 0 3.75rem">
          <Link
            role="button"
            onClick={onClick}
            css={css`
              padding: ${SPACING.spacing4};
              text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
              color: ${COLORS.grey60};
              &:hover {
                color: ${COLORS.grey40};
              }
              outline: 1px solid red;
            `}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {linkText}
            </StyledText>
          </Link>
        </Flex>
      ) : null}
    </Flex>
  )
}
