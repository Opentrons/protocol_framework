import { useDragLayer } from 'react-dnd'
import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { DECK_CONTROLS_STYLE } from '../constants'
import type { RobotCoordinateSpaceWithRefRenderProps } from '@opentrons/components'
import type { DroppedItem } from '../types'

interface DragPreviewProps {
  getRobotCoordsFromDOMCoords: RobotCoordinateSpaceWithRefRenderProps['getRobotCoordsFromDOMCoords']
}

export function DragPreview(props: DragPreviewProps): JSX.Element | null {
  const { getRobotCoordsFromDOMCoords } = props
  const { item, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem() as DroppedItem,
    currentOffset: monitor.getSourceClientOffset(),
  }))

  if (!currentOffset || !item) {
    return null
  }

  const width = item.labwareOnDeck.def.dimensions.xDimension
  const height = item.labwareOnDeck.def.dimensions.yDimension

  const cursor = getRobotCoordsFromDOMCoords(currentOffset.x, currentOffset.y)

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
          zIndex: 10,
          position: 'absolute',
          cursor: 'grabbing',
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
