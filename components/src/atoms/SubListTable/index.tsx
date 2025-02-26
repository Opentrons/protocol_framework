import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  Flex,
  SPACING,
  DISPLAY_GRID,
  StyledText,
  COLORS,
} from '@opentrons/components'

import type { ReactNode } from 'react'
import type { FlattenSimpleInterpolation } from 'styled-components'

export interface SubListTableProps {
  children: ReactNode
  headers?: [string?, string?, string?]
}

// SubListTable does not contain the semantic HTML table identity but is otherwise equivalent to ListTable.
// Use SubListTable when there should a table-esque component in a real table (ListTable).
export function SubListTable({
  headers,
  children,
}: SubListTableProps): JSX.Element {
  return (
    <Flex css={CONTAINER_STYLE}>
      <div css={headerContainerStyle(headers?.length ?? 0)}>
        {headers?.map(header => (
          <StyledText
            key={header + Math.random().toString()}
            oddStyle="bodyTextSemiBold"
            desktopStyle="bodyDefaultRegular"
            css={HEADER_ITEM_STYLE}
          >
            {header}
          </StyledText>
        ))}
      </div>
      <Flex css={CONTENT_CONTAINER_STYLE}>{children}</Flex>
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing8};
`

const CONTENT_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing4};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: ${SPACING.spacing8};
  }
`

const headerContainerStyle = (
  numHeaders: number
): FlattenSimpleInterpolation => css`
  display: ${DISPLAY_GRID};
  grid-template-columns: repeat(${numHeaders}, 1fr);
  padding: 0 ${SPACING.spacing12};
  gap: ${SPACING.spacing24};
`

const HEADER_ITEM_STYLE = css`
  color: ${COLORS.grey60};
`
