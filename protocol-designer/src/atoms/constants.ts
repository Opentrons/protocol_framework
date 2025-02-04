import { css } from 'styled-components'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_HIDDEN,
} from '@opentrons/components'
import type { FlattenSimpleInterpolation } from 'styled-components'

export const LINK_BUTTON_STYLE = css`
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

export const LINE_CLAMP_TEXT_STYLE = (
  lineClamp: number,
  title?: boolean
): FlattenSimpleInterpolation => css`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: ${OVERFLOW_HIDDEN};
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: ${lineClamp};
  word-break: ${title === true
    ? 'normal'
    : 'break-all'}; // normal for tile and break-all for a non word case like aaaaaaaa
`

const MIN_OVERVIEW_WIDTH = '64rem'
const COLUMN_GRID_GAP = '5rem'
export const COLUMN_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  min-width: calc((${MIN_OVERVIEW_WIDTH} - ${COLUMN_GRID_GAP}) * 0.5);
  flex: 1;
`

<<<<<<< HEAD
export const DescriptionFieldContainer: any = styled(Flex)`
  border-radius: ${BORDERS.borderRadius4};

  &:focus-visible {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey55};
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
    outline-offset: 2px;
  }
`

export const DescriptionField = styled.textarea`
  min-height: 5rem;
  width: 100%;
  border: 1px ${BORDERS.styleSolid} ${COLORS.grey50}; /* Default border */
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8};
  font-size: ${TYPOGRAPHY.fontSizeP};
  resize: none;

  /* Default (no pseudo-classes) */
  &:not(:hover):not(:focus):not(:active) {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey50};
  }

  /* Hover state */
  &:hover {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey60};
  }

  /* Active state (clicking) */
  &:active {
    border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
    outline: none; /* Ensure the active state overrides focus-visible */
  }

  &:focus {
    outline: none;
  }

  /* Focus-visible (keyboard focus) */
  /* &:focus-visible {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey55};
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
    outline-offset: 2px;
  } */

  /* Disabled state */
  &:disabled {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
    background-color: ${COLORS.grey20};
    cursor: not-allowed;
  }
`
=======
export const NAV_BAR_HEIGHT_REM = 4
>>>>>>> edge
