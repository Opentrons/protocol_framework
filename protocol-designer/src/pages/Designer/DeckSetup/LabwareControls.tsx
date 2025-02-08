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
import { BlockedSlot } from './BlockedSlot'
import { DND_TYPES } from '../../../constants'
import { moveDeckItem } from '../../../labware-ingred/actions'
import { DECK_CONTROLS_STYLE } from './constants'

import type { DropTargetMonitor } from 'react-dnd'
import type { LabwareOnDeck } from '../../../step-forms'
import type { ThunkDispatch } from '../../../types'
import type { SharedControlsType } from './types'

interface LabwareControlsProps extends SharedControlsType {
  labwareOnDeck: LabwareOnDeck
  setHoveredLabware: (labware?: LabwareOnDeck | null) => void
  setDraggedLabware: (labware?: LabwareOnDeck | null) => void
  swapBlocked: boolean
}

interface DroppedItem {
  labwareOnDeck: LabwareOnDeck
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
  const { t } = useTranslation('starting_deck_state')

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

  let hoverOpacity = '0'
  if (isBeingDragged) {
    hoverOpacity = '0.2'
  } else if (hover != null && hover === itemId) {
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
                {isBeingDragged ? 'dragging' : t('edit_labware')}
              </StyledText>
            </Link>
          </Flex>
        </RobotCoordsForeignDiv>
      )}
    </>
  )
}
