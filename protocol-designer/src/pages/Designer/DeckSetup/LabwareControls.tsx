import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useDrag, useDrop } from 'react-dnd'
import { useEffect, useRef } from 'react'
import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import { DND_TYPES } from '../../../constants'
import { moveDeckItem } from '../../../labware-ingred/actions'
import { DECK_CONTROLS_STYLE } from './constants'
import { BlockedSlot } from './BlockedSlot'

import type { DropTargetMonitor } from 'react-dnd'
import type { LabwareOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'
import type { SharedControlsType, DroppedItem } from './types'

interface LabwareControlsProps extends SharedControlsType {
  labwareOnDeck: LabwareOnDeck
  setHoveredLabware: (labware?: LabwareOnDeck | null) => void
  setDraggedLabware: (labware?: LabwareOnDeck | null) => void
  swapBlocked: boolean
}

export const LabwareControls = (
  props: LabwareControlsProps
): JSX.Element | null => {
  const {
    labwareOnDeck,
    slotPosition,
    setHoveredLabware,
    setDraggedLabware,
    swapBlocked,
    hover,
    setHover,
    setShowMenuListForId,
    isSelected,
    tab,
    itemId,
  } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const ref = useRef(null)
  const { t } = useTranslation(['starting_deck_state', 'deck'])

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPES.LABWARE,
      item: { labwareOnDeck },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [labwareOnDeck]
  )

  const [{ isOver, draggedLabware, canDrop }, drop] = useDrop(
    () => ({
      accept: DND_TYPES.LABWARE,
      canDrop: (item: DroppedItem) => {
        const draggedLabware = item?.labwareOnDeck
        const isDifferentSlot =
          draggedLabware && draggedLabware.slot !== labwareOnDeck.slot
        return isDifferentSlot && !swapBlocked
      },
      drop: (item: DroppedItem) => {
        const draggedLabware = item?.labwareOnDeck
        if (draggedLabware != null) {
          dispatch(moveDeckItem(draggedLabware.slot, labwareOnDeck.slot))
        }
      },
      hover: () => {
        setHoveredLabware(labwareOnDeck)
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
        draggedLabware: monitor.getItem() as DroppedItem,
        canDrop: monitor.canDrop(),
      }),
    }),
    [labwareOnDeck]
  )

  useEffect(() => {
    if (draggedLabware?.labwareOnDeck != null) {
      setDraggedLabware(draggedLabware?.labwareOnDeck)
    } else {
      setHoveredLabware(null)
      setDraggedLabware(null)
    }
  }, [draggedLabware])

  const isBeingDragged =
    draggedLabware?.labwareOnDeck?.slot === labwareOnDeck.slot

  drag(drop(ref))

  if (tab === 'protocolSteps' || isSelected || slotPosition == null) {
    return null
  }

  const [x, y] = slotPosition
  const width = labwareOnDeck.def.dimensions.xDimension
  const height = labwareOnDeck.def.dimensions.yDimension

  const getDisplayText = (): string => {
    if (isDragging) {
      return t('deck:overlay.slot.drag_to_new_slot')
    }
    if (isBeingDragged) {
      return ''
    }
    if (isOver && canDrop) {
      return t('deck:overlay.slot.place_here')
    }
    return t('edit_labware')
  }

  let hoverOpacity = '0'
  if (isOver && canDrop) {
    hoverOpacity = '0.8'
  } else if (hover === itemId) {
    hoverOpacity = '1'
  }

  return (
    <>
      {swapBlocked ? (
        <BlockedSlot
          {...{ x, y, width, height }}
          message="MODULE_INCOMPATIBLE_LABWARE_SWAP"
        />
      ) : (
        <RobotCoordsForeignDiv
          {...{ x, y, width, height }}
          dataTestId={itemId}
          innerDivProps={{
            style: {
              opacity: hoverOpacity,
              ...DECK_CONTROLS_STYLE,
              zIndex: isOver && canDrop ? 50 : 'auto',
            },
            onMouseEnter: () => {
              setHover(itemId)
            },
            onMouseLeave: () => {
              setHover(null)
            },
            onClick: () => {
              if (!isBeingDragged) {
                setShowMenuListForId(itemId)
              }
            },
          }}
        >
          <Flex
            ref={ref}
            width={width}
            height={height}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
          >
            <Link role="button">
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {getDisplayText()}
              </StyledText>
            </Link>
          </Flex>
        </RobotCoordsForeignDiv>
      )}
    </>
  )
}
