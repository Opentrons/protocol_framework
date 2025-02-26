import { useSelector } from 'react-redux'
import { useEffect, useMemo, useState } from 'react'
import {
  ALIGN_CENTER,
  BORDERS,
  CURSOR_GRABBING,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignObject,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getInitialDeckSetup } from '../../../../step-forms/selectors'
import { getRobotType } from '../../../../file-data/selectors'
import { getFlexHoverDimensions, getOT2HoverDimensions } from '../utils'

import type { MutableRefObject, ReactNode } from 'react'
import type {
  AddressableAreaName,
  CoordinateTuple,
  DeckSlotId,
} from '@opentrons/shared-data'

interface SlotOverlayProps {
  slotId: DeckSlotId
  slotPosition: CoordinateTuple | null
  slotFillColor: string
  slotFillOpacity: string
  children: ReactNode
  ref?: MutableRefObject<null>
}

export function SlotOverlay(props: SlotOverlayProps): JSX.Element | null {
  const {
    slotId,
    slotPosition,
    slotFillColor,
    slotFillOpacity,
    children,
  } = props
  const robotType = useSelector(getRobotType)
  const deckSetup = useSelector(getInitialDeckSetup)
  const [stableOpacity, setStableOpacity] = useState<string>(slotFillOpacity)
  const { additionalEquipmentOnDeck, modules } = deckSetup
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [])
  const hasTCOnSlot = Object.values(modules).find(
    module => module.slot === slotId && module.type === THERMOCYCLER_MODULE_TYPE
  )
  const tcSlots = robotType === FLEX_ROBOT_TYPE ? ['A1'] : ['8', '10', '11']
  const stagingAreaLocations = Object.values(additionalEquipmentOnDeck)
    .filter(ae => ae.name === 'stagingArea')
    ?.map(ae => ae.location as string)

  const cutoutId =
    getCutoutIdForAddressableArea(
      slotId as AddressableAreaName,
      deckDef.cutoutFixtures
    ) ?? 'cutoutD1'

  // Debounce opacity changes to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setStableOpacity(slotFillOpacity)
    }, 50)
    return () => {
      clearTimeout(timer)
    }
  }, [slotFillOpacity])

  //  return null for TC slots
  if (slotPosition === null || (hasTCOnSlot && tcSlots.includes(slotId)))
    return null

  const slotFill = (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={slotFillColor}
      borderRadius={BORDERS.borderRadius4}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
    >
      {children}
    </Flex>
  )

  if (robotType === FLEX_ROBOT_TYPE) {
    const { width, height, x, y } = getFlexHoverDimensions(
      stagingAreaLocations,
      cutoutId,
      slotId,
      hasTCOnSlot != null,
      slotPosition
    )

    return (
      <RobotCoordsForeignObject
        key="flex_slotOverlay"
        width={width}
        height={height}
        x={x}
        y={y}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{
          opacity: stableOpacity,
          flex: '1',
          zIndex: 10,
          cursor: CURSOR_GRABBING,
        }}
      >
        {slotFill}
      </RobotCoordsForeignObject>
    )
  } else {
    const { width, height, x, y } = getOT2HoverDimensions(
      hasTCOnSlot != null,
      slotPosition
    )

    return (
      <RobotCoordsForeignObject
        key="ot2_slotOverlay"
        width={width}
        height={height}
        x={x}
        y={y}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{
          opacity: stableOpacity,
          flex: '1',
          zIndex: 10,
          cursor: CURSOR_GRABBING,
        }}
      >
        {slotFill}
      </RobotCoordsForeignObject>
    )
  }
}
