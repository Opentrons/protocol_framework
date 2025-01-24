import styled, { css } from 'styled-components'
import {
  SPACING,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  TertiaryBtn,
} from '@opentrons/components'

const baseStyles = css`
  border-radius: ${BORDERS.borderRadiusFull};
  box-shadow: none;
  overflow: no-wrap;
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  text-transform: ${TYPOGRAPHY.textTransformNone};

  &:hover {
    box-shadow: none;
  }
`

const STYLE_MAP = {
  primary: css`
    background-color: ${COLORS.blue50};
    color: ${COLORS.white};

    &:hover {
      background-color: ${COLORS.blue55};
    }

    $:active {
      background-color: ${COLORS.blue60};
    }

    &:focus-visible {
      background-color: ${COLORS.blue55};
    }

    &:disabled {
      background-color: ${COLORS.grey30};
      color: ${COLORS.grey40};
    }
  `,
  secondary: css`
    background-color: ${COLORS.white};
    color: ${COLORS.blue50};
    border: 1px solid ${COLORS.blue50};

    &:hover {
      background-color: ${COLORS.white};
      color: ${COLORS.blue50}${COLORS.opacity60HexCode};
      border: 1px solid ${COLORS.blue50}${COLORS.opacity60HexCode};
    }

    $:active {
      background-color: ${COLORS.white};
      color: ${COLORS.blue50};
      border: 1px solid ${COLORS.blue50};
    }

    &:focus-visible {
      background-color: ${COLORS.white};
      color: ${COLORS.blue50};
      border: 1px solid ${COLORS.blue50};
    }

    &:disabled {
      background-color: ${COLORS.white};
      color: ${COLORS.grey40};
      border: 1px solid ${COLORS.grey30};
    }
  `,
  white: css`
    background-color: ${COLORS.transparent};
    color: ${COLORS.grey60};

    &:hover {
      background-color: ${COLORS.grey30};
    }

    $:active {
      background-color: ${COLORS.grey35};
    }

    &:focus-visible {
      background-color: ${COLORS.grey30};
    }

    &:disabled {
      color: ${COLORS.grey40};
    }
  `,
}

export const TertiaryButton = styled(TertiaryBtn)<{
  buttonType: 'primary' | 'secondary' | 'white'
}>`
  ${baseStyles}
  ${({ buttonType }) => STYLE_MAP[buttonType] || ''}
`
