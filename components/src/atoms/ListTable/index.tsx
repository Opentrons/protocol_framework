import { css } from 'styled-components'

import { StyledText } from '../StyledText'
import { DIRECTION_COLUMN } from '../../styles'
import { SPACING, RESPONSIVENESS } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'

import type { ReactNode } from 'react'
import type { FlattenSimpleInterpolation } from 'styled-components'

export interface ListTableProps {
  children: ReactNode
  headers?: [string?, string?, string?, string?] // maximum of 4
}

// ListTable contains the semantic HTML table identity.
// This is a table-focused version of SubListTable, and children should include proper
// <tr> tags when applicable.
export function ListTable({ headers, children }: ListTableProps): JSX.Element {
  const numHeaders = headers ? headers.filter(Boolean).length : 0

  return (
    <table css={TABLE_STYLE}>
      {headers != null && headers.some(header => header !== undefined) && (
        <thead css={THEAD_STYLE}>
          <tr css={trStyle(numHeaders)}>
            {headers.map(header => (
              <th key={header + Math.random().toString()} css={TH_STYLE}>
                {header && (
                  <StyledText
                    oddStyle="bodyTextSemiBold"
                    desktopStyle="bodyDefaultRegular"
                    css={HEADER_ITEM_STYLE}
                  >
                    {header}
                  </StyledText>
                )}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody css={TBODY_STYLE}>{children}</tbody>
    </table>
  )
}

const TABLE_STYLE = css`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`

const THEAD_STYLE = css`
  margin-bottom: ${SPACING.spacing8};
`

const trStyle = (numHeaders: number): FlattenSimpleInterpolation => css`
  display: grid;
  grid-template-columns: repeat(${numHeaders}, 1fr);
  gap: ${SPACING.spacing24};
`

const TH_STYLE = css`
  padding: 0 ${SPACING.spacing12};
  text-align: left;
  font-weight: normal;
`

const TBODY_STYLE = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing4};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: ${SPACING.spacing8};
  }
`

const HEADER_ITEM_STYLE = css`
  color: ${COLORS.grey60};
`
