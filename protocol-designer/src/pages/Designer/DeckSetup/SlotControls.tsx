import { useTranslation } from 'react-i18next'
import { Dispatch, SetStateAction, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDrop, useDrag } from 'react-dnd'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_CENTER,
  Link,
  POSITION_ABSOLUTE,
  PRODUCT,
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

import type { DropTargetMonitor } from 'react-dnd'
import type {
  CoordinateTuple,
  DeckSlotId,
  Dimensions,
  ModuleType,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'
import type { DeckSetupTabType } from '../types'

interface SlotControlsProps extends DeckSetupTabType {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  //  slotId can be either AddressableAreaName or moduleId
  slotId: string
  moduleType: ModuleType | null
  setHover: Dispatch<SetStateAction<string | null>>
  hover: string | null
  itemId: string
  menuListId: DeckSlotId | null
  setShowMenuListForId: Dispatch<SetStateAction<string | null>>
  isSelected?: boolean
  handleDragHover?: () => void
}

interface DroppedItem {
  labwareOnDeck: LabwareOnDeck
}

export const SlotControls = (props: SlotControlsProps): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    moduleType,
    handleDragHover,
    itemId,
    hover,
    setHover,
    isSelected,
    tab,
    menuListId,
    setShowMenuListForId,
  } = props
  const { t } = useTranslation(['deck', 'starting_deck_state'])
  const hoverOpacity =
    (hover != null && hover === itemId) || menuListId === itemId ? '1' : '0'
  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const ref = useRef(null)
  const dispatch = useDispatch()

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
        console.log('hello hit here', moduleType, draggedDef)
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
    slotPosition == null
  )
    return null

  const draggedDef = draggedItem?.labwareOnDeck?.def
  console.log('dragged item', draggedItem)
  const isCustomLabware =
    draggedItem != null && draggedItem.labwareOnDeck != null
      ? getLabwareIsCustom(customLabwareDefs, draggedItem.labwareOnDeck)
      : false

  drag(drop(ref))

  if (tab === 'protocolSteps' || slotPosition === null || isSelected)
    return null

  const x = slotPosition[0]
  const y = slotPosition[1]
  const width = slotBoundingBox.xDimension
  const height = slotBoundingBox.yDimension

  let slotBlocked: string | null = null
  if (
    isOver &&
    moduleType != null &&
    draggedDef != null &&
    !getLabwareIsCompatible(draggedDef, moduleType)
  ) {
    slotBlocked = 'Labware incompatible with this module'
  }

  return (
    <g ref={ref}>
      {slotBlocked ? (
        <BlockedSlot
          x={slotPosition[0]}
          y={slotPosition[1]}
          width={slotBoundingBox.xDimension}
          height={slotBoundingBox.yDimension}
          message="MODULE_INCOMPATIBLE_SINGLE_LABWARE"
        />
      ) : (
        <RobotCoordsForeignDiv
          x={x}
          y={y}
          width={width}
          height={height}
          innerDivProps={{
            style: {
              opacity: hoverOpacity,
              position: POSITION_ABSOLUTE,
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              transform: 'rotate(180deg) scaleX(-1)',
              zIndex: 1,
              backgroundColor: `${COLORS.black90}cc`,
              display: DISPLAY_FLEX,
              alignItems: ALIGN_CENTER,
              color: COLORS.white,
              fontSize: PRODUCT.TYPOGRAPHY.fontSizeBodyDefaultSemiBold,
              borderRadius: BORDERS.borderRadius8,
              cursor: CURSOR_POINTER,
            },
            onMouseEnter: () => {
              setHover(itemId)
            },
            onMouseLeave: () => {
              setHover(null)
            },
            onClick: () => {
              setShowMenuListForId(itemId)
            },
          }}
        >
          <Flex
            height={height}
            width={width}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
          >
            <Link role="button">
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {isOver
                  ? t('overlay.slot.place_here')
                  : t('starting_deck_state:edit_slot')}
              </StyledText>
            </Link>
          </Flex>
        </RobotCoordsForeignDiv>
      )}
    </g>
  )
}
