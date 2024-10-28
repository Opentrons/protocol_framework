import * as React from 'react'
import { css } from 'styled-components'
import { Flex, Svg } from '../../primitives'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'

export interface RobotCoordinateSpaceWithRefRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
}

interface RobotCoordinateSpaceWithRefProps
  extends React.ComponentProps<typeof Svg> {
  viewBox?: string | null
  deckDef?: DeckDefinition
  zoomed?: boolean
  children?: (props: RobotCoordinateSpaceWithRefRenderProps) => React.ReactNode
}

export function RobotCoordinateSpaceWithRef(
  props: RobotCoordinateSpaceWithRefProps
): JSX.Element | null {
  const { children, deckDef, viewBox, zoomed = false, ...restProps } = props
  const wrapperRef = React.useRef<SVGSVGElement>(null)

  if (deckDef == null && viewBox == null) return null

  let wholeDeckViewBox
  let deckSlotsById = {}
  if (deckDef != null) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    deckSlotsById = deckDef.locations.addressableAreas.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )

    // Add padding to prevent clipping and better center the content
    const PADDING = 20
    wholeDeckViewBox = `${viewBoxOriginX - PADDING} ${
      viewBoxOriginY - PADDING
    } ${deckXDimension + PADDING * 2} ${deckYDimension + PADDING * 2}`
  }
  return (
    <Flex
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      css={css`
        outline: purple solid 1px;
      `}
    >
      <Svg
        viewBox={zoomed ? viewBox : wholeDeckViewBox}
        ref={wrapperRef}
        transform="scale(1, -1)"
        width="100%"
        height="100%"
        css={css`
          outline: red solid 1px;
        `}
        {...restProps}
      >
        {children?.({ deckSlotsById })}
      </Svg>
    </Flex>
  )
}
