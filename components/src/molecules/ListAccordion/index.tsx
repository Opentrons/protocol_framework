import { useState } from 'react'
import { css } from 'styled-components'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  RESPONSIVENESS,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
} from '@opentrons/components'

import { ListTable } from '../../atoms/ListTable'

import type { ReactNode } from 'react'
import type { FlattenSimpleInterpolation } from 'styled-components'
import type { ListTableProps } from '../../atoms/ListTable'

const TRANSITION_STYLE = 'all 150ms ease-in'

export type ListAccordionAlertKind = 'default' | 'warning'

const CONTAINER_GAP = SPACING.spacing24

export interface ListAccordionProps {
  /* The "above the fold" content that is always present regardless of open/close state. */
  headerChild: ReactNode
  alertKind: ListAccordionAlertKind
  /* The "below the fold" table headers. */
  tableHeaders: ListTableProps['headers']
  /* The "below the fold" content. */
  children: ListTableProps['children']
  /* Specific alertKinds override an optional icon if supplied. */
  icon?: JSX.Element
}

export function ListAccordion({
  headerChild,
  alertKind,
  icon,
  children,
  tableHeaders,
}: ListAccordionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Flex css={containerStyle(alertKind)}>
      <Flex
        css={HEADER_CONTAINER_STYLE}
        onClick={() => {
          setIsOpen(!isOpen)
        }}
      >
        <Flex css={HEADER_ICON_CHILD_STYLE}>
          {alertKind !== 'default' ? (
            <Icon
              name="alert-circle"
              css={ALERT_ICON_STYLE}
              data-testid="alert-circle"
            />
          ) : (
            icon
          )}
          {headerChild}
        </Flex>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          data-testid={isOpen ? 'chevron-up' : 'chevron-down'}
          css={CHEVRON_STYLE}
        />
      </Flex>
      <Flex css={contentContainerStyle(isOpen)}>
        <ListTable headers={tableHeaders}>{children}</ListTable>
      </Flex>
    </Flex>
  )
}

const containerStyle = (
  alertKind: ListAccordionAlertKind
): FlattenSimpleInterpolation => {
  return css`
    flex-direction: ${DIRECTION_COLUMN};
    padding: ${SPACING.spacing24};
    border-radius: ${SPACING.spacing16};
    gap: ${CONTAINER_GAP};
    background-color: ${alertKind === 'warning'
      ? COLORS.yellow30
      : COLORS.grey20};
    transition: ${TRANSITION_STYLE};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      background-color: ${alertKind === 'warning'
        ? COLORS.yellow35
        : COLORS.grey35};
    }
  `
}

const contentContainerStyle = (isOpen: boolean): FlattenSimpleInterpolation => {
  return css`
    flex-direction: ${DIRECTION_COLUMN};
    max-height: ${isOpen ? '10000000px' : '0px'};
    opacity: ${isOpen ? 1 : 0};
    overflow: hidden;
    margin-top: ${isOpen ? '0px' : `-${CONTAINER_GAP}`};
    transition: ${TRANSITION_STYLE};
  `
}

const HEADER_CONTAINER_STYLE = css`
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  gap: ${SPACING.spacing40};
  cursor: pointer;
`

const HEADER_ICON_CHILD_STYLE = css`
  gap: ${SPACING.spacing12};
  align-items: ${ALIGN_CENTER};
`

const ALERT_ICON_STYLE = css`
  color: ${COLORS.yellow60};
  height: ${SPACING.spacing20};
  width: ${SPACING.spacing20};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: ${SPACING.spacing32};
    width: ${SPACING.spacing32};
  }
`

const CHEVRON_STYLE = css`
  height: ${SPACING.spacing48};
  width: ${SPACING.spacing48};
`
