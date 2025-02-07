import { useTranslation } from 'react-i18next'
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd'
import { useDispatch, useSelector } from 'react-redux'
import { useRef, useEffect } from 'react'
import { css } from 'styled-components'
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
import { moveDeckItem } from '../../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { BlockedSlot } from './BlockedSlot'

import type { Dispatch, SetStateAction } from 'react'
import type {
  CoordinateTuple,
  DeckSlotId,
  Dimensions,
} from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'
import type { DeckSetupTabType } from '../types'

interface DeckItemHoverProps extends DeckSetupTabType {
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  slotBoundingBox: Dimensions
  //  can be slotId or labwareId (for off-deck labware)
  itemId: string
  slotPosition: CoordinateTuple | null
  setShowMenuListForId: Dispatch<SetStateAction<string | null>>
  labwareOnDeck: LabwareOnDeck
  menuListId: DeckSlotId | null
  setHoveredLabware?: (labware?: LabwareOnDeck | null) => void
  setDraggedLabware?: (labware?: LabwareOnDeck | null) => void
  swapBlocked?: boolean
  isSelected?: boolean
}

interface DroppedItem {
  labwareOnDeck: LabwareOnDeck
}

export function DeckItemHover(props: DeckItemHoverProps): JSX.Element | null {
  const {
    hover,
    tab,
    setHover,
    slotBoundingBox,
    itemId,
    setShowMenuListForId,
    menuListId,
    slotPosition,
    setHoveredLabware,
    setDraggedLabware,
    isSelected = false,
    swapBlocked,
    labwareOnDeck,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const deckSetup = useSelector(getDeckSetupForActiveItem)

  const offDeckLabware = Object.values(deckSetup.labware).find(
    lw => lw.id === itemId
  )

  const hoverOpacity =
    (hover != null && hover === itemId) || menuListId === itemId ? '1' : '0'

  const dispatch = useDispatch<ThunkDispatch<any>>()
  const ref = useRef(null)

  const [, drag] = useDrag(
    () => ({
      type: DND_TYPES.LABWARE,
      item: { labwareOnDeck },
    }),
    [labwareOnDeck]
  )

  const [{ draggedLabware }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        const draggedLabware = item?.labwareOnDeck
        const isDifferentSlot =
          draggedLabware && draggedLabware.slot !== labwareOnDeck?.slot
        return isDifferentSlot && !swapBlocked
      },
      drop: (item: DroppedItem) => {
        const draggedLabware = item?.labwareOnDeck
        if (draggedLabware != null && labwareOnDeck != null) {
          dispatch(moveDeckItem(draggedLabware.slot, labwareOnDeck.slot))
        }
      },
      hover: () => {
        setHoveredLabware?.(labwareOnDeck)
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
        draggedLabware: monitor.getItem() as DroppedItem,
      }),
    }),
    [labwareOnDeck]
  )

  useEffect(() => {
    if (draggedLabware?.labwareOnDeck != null && setDraggedLabware != null) {
      setDraggedLabware(draggedLabware?.labwareOnDeck)
    } else {
      setHoveredLabware?.(null)
      setDraggedLabware?.(null)
    }
  }, [draggedLabware])

  const isBeingDragged =
    draggedLabware?.labwareOnDeck?.slot === labwareOnDeck?.slot

  drag(drop(ref))

  if (tab === 'protocolSteps' || slotPosition === null || isSelected)
    return null

  const x = slotPosition[0]
  const y = slotPosition[1]
  const width = slotBoundingBox.xDimension
  const height = slotBoundingBox.yDimension

  console.log('swapBlocked in deckItemHover', swapBlocked)
  return (
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
        ref={ref}
        css={css`
          opacity: ${hoverOpacity};
        `}
      >
        <Flex
          height={height}
          width={width}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <Link role="button">
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {isBeingDragged
                ? 'dragging'
                : offDeckLabware?.slot === 'offDeck'
                ? t('edit_labware')
                : t('edit_slot')}
            </StyledText>
          </Link>
        </Flex>
      </Flex>
      {swapBlocked && (
        <BlockedSlot
          {...{ x, y, width, height }}
          message="MODULE_INCOMPATIBLE_LABWARE_SWAP"
        />
      )}
    </RobotCoordsForeignDiv>
  )
}
