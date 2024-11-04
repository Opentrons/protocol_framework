import styled from 'styled-components'
import { Flex } from '../../primitives'
import {
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  Icon,
  SPACING,
  StyledText,
  JUSTIFY_CENTER,
  JUSTIFY_START,
  ALIGN_CENTER,
  FLEX_MAX_CONTENT,
} from '../../index'
import {
  black90,
  blue30,
  blue50,
  grey30,
  grey40,
  white,
} from '../../helix-design-system/colors'
import { borderRadius8 } from '../../helix-design-system/borders'
import type { IconName } from '../../index'

interface EmptySelectorButtonProps {
  onClick: () => void
  text: string
  textAlignment: 'left' | 'middle'
  iconName?: IconName
  disabled?: boolean
}

//  used for helix and Opentrons Ai
export function EmptySelectorButton(
  props: EmptySelectorButtonProps
): JSX.Element {
  const { onClick, text, iconName, textAlignment, disabled = false } = props

  return (
    <StyledButton onClick={onClick} disabled={disabled}>
      <Flex
        gridGap={SPACING.spacing4}
        padding={SPACING.spacing12}
        backgroundColor={disabled ? grey30 : blue30}
        color={disabled ? grey40 : black90}
        borderRadius={borderRadius8}
        border={`2px dashed ${disabled ? grey40 : blue50}`}
        width="100%"
        height="100%"
        alignItems={ALIGN_CENTER}
        data-testid="EmptySelectorButton_container"
        justifyContent={
          textAlignment === 'middle' ? JUSTIFY_CENTER : JUSTIFY_START
        }
      >
        {iconName != null ? (
          <Icon
            name={iconName}
            size="1.25rem"
            data-testid={`EmptySelectorButton_${iconName}`}
          />
        ) : null}
        <StyledText desktopStyle="bodyDefaultSemiBold">{text}</StyledText>
      </Flex>
    </StyledButton>
  )
}

interface ButtonProps {
  disabled: boolean
}

const StyledButton = styled.button<ButtonProps>`
  border: none;
  width: ${FLEX_MAX_CONTENT};
  height: ${FLEX_MAX_CONTENT};
  cursor: ${({ disabled }) => (disabled ? CURSOR_DEFAULT : CURSOR_POINTER)};
  &:focus-visible {
    outline: 2px solid ${white};
    box-shadow: 0 0 0 4px ${blue50};
    border-radius: ${borderRadius8};
  }
`
