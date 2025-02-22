import { useDragLayer } from 'react-dnd'
import {
  ALIGN_CENTER,
  CURSOR_GRABBING,
  Flex,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { DND_TYPES } from '../../../../constants'
import { DECK_CONTROLS_STYLE } from '../constants'
import type { RobotCoordinateSpaceWithRefRenderProps } from '@opentrons/components'
import type { DroppedItem } from '../types'

interface DragPreviewProps {
  getRobotCoordsFromDOMCoords: RobotCoordinateSpaceWithRefRenderProps['getRobotCoordsFromDOMCoords']
}

export function DragPreview(props: DragPreviewProps): JSX.Element | null {
  const { getRobotCoordsFromDOMCoords } = props
  const { item, currentOffset, itemType } = useDragLayer(monitor => ({
    itemType: monitor.getItemType(),
    item: monitor.getItem() as DroppedItem,
    currentOffset: monitor.getSourceClientOffset(),
  }))

  if (!currentOffset || !item || itemType !== DND_TYPES.LABWARE) {
    return null
  }

  const width = item.labwareOnDeck.def.dimensions.xDimension
  const height = item.labwareOnDeck.def.dimensions.yDimension

  // const cursor = getRobotCoordsFromDOMCoords(currentOffset.x, currentOffset.y)
  const extraPadding = 25

  const cursor = getRobotCoordsFromDOMCoords(
    currentOffset.x + extraPadding, // Adjust X position
    currentOffset.y + extraPadding * 1.2 // Adjust Y position 1.5 prevents dragging
  )

  return (
    <RobotCoordsForeignDiv
      x={cursor.x}
      y={cursor.y}
      width={width + 25}
      height={height + 25}
      innerDivProps={{
        style: {
          opacity: '0.2',
          ...DECK_CONTROLS_STYLE,
          position: POSITION_ABSOLUTE,
          cursor: CURSOR_GRABBING,
        },
      }}
    >
      <Flex
        width={width}
        height={height}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      />
    </RobotCoordsForeignDiv>
  )
}
