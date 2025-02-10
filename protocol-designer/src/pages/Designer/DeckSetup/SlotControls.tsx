import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrop, useDrag } from 'react-dnd'
import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import { DND_TYPES } from '../../../constants'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import { moveDeckItem } from '../../../labware-ingred/actions'
import { selectors as labwareDefSelectors } from '../../../labware-defs'
import { BlockedSlot } from './BlockedSlot'
import { DECK_CONTROLS_STYLE } from './constants'

import type { DropTargetMonitor } from 'react-dnd'
import type { Dimensions, ModuleType } from '@opentrons/shared-data'
import type { SharedControlsType, DroppedItem } from './types'

interface SlotControlsProps extends SharedControlsType {
  slotBoundingBox: Dimensions
  //  NOTE: slotId can be either AddressableAreaName or moduleId
  slotId: string
  moduleType: ModuleType | null
  handleDragHover?: () => void
}

export const SlotControls = (props: SlotControlsProps): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    moduleType,
    hover,
    handleDragHover,
    setHover,
    setShowMenuListForId,
    itemId,
    tab,
    isSelected,
  } = props
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const ref = useRef(null)
  const dispatch = useDispatch()

  const { t } = useTranslation(['deck', 'starting_deck_state'])

  const [, drag] = useDrag({
    type: DND_TYPES.LABWARE,
    item: { labwareOnDeck: null },
  })

  const [{ draggedItem, itemType, isOver }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        const draggedDef = item?.labwareOnDeck?.def
        console.assert(
          draggedDef,
          'no labware def of dragged item, expected it on drop'
        )

        if (moduleType != null && draggedDef != null) {
          // this is a module slot, prevent drop if the dragged labware is not compatible
          const isCustomLabware = getLabwareIsCustom(
            customLabwareDefs,
            item.labwareOnDeck
          )

          return (
            getLabwareIsCompatible(draggedDef, moduleType) || isCustomLabware
          )
        }
        return true
      },
      drop: (item: DroppedItem) => {
        const droppedLabware = item
        if (droppedLabware.labwareOnDeck != null) {
          const droppedSlot = droppedLabware.labwareOnDeck.slot
          dispatch(moveDeckItem(droppedSlot, slotId))
        }
      },
      hover: () => {
        if (handleDragHover != null) {
          handleDragHover()
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        itemType: monitor.getItemType(),
        isOver: !!monitor.isOver(),
        draggedItem: monitor.getItem() as DroppedItem,
      }),
    }),
    []
  )

  if (
    (itemType !== DND_TYPES.LABWARE && itemType !== null) ||
    slotPosition == null ||
    tab === 'protocolSteps' ||
    isSelected
  )
    return null

  const draggedDef = draggedItem?.labwareOnDeck?.def

  const isCustomLabware =
    draggedItem != null
      ? getLabwareIsCustom(customLabwareDefs, draggedItem.labwareOnDeck)
      : false

  const isSlotBlocked =
    isOver &&
    moduleType != null &&
    draggedDef != null &&
    !getLabwareIsCompatible(draggedDef, moduleType) &&
    !isCustomLabware

  drag(drop(ref))

  const hoverOpacity = (hover != null && hover === itemId) || isOver ? '1' : '0'

  return (
    <g ref={ref}>
      {isSlotBlocked ? (
        <BlockedSlot
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          message="MODULE_INCOMPATIBLE_SINGLE_LABWARE"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          innerDivProps={{
            style: {
              opacity: hoverOpacity,
              ...DECK_CONTROLS_STYLE,
            },
            onMouseEnter: () => {
              setHover(itemId)
            },
            onMouseLeave: () => {
              setHover(null)
            },
            onClick: () => {
              if (!isOver) {
                setShowMenuListForId(itemId)
              }
            },
          }}
        >
          <Flex
            width={slotBoundingBox.xDimension}
            height={slotBoundingBox.yDimension}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
          >
            <Link role="button">
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {isOver
                  ? t(`overlay.slot.place_here`)
                  : t('starting_deck_state:edit_labware')}
              </StyledText>
            </Link>
          </Flex>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}
