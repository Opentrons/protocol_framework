import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import {
  ALIGN_CENTER,
  BORDERS,
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

const FOURTH_COLUMN_SLOTS = ['A4', 'B4', 'C4', 'D4']

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
    const hasStagingArea = stagingAreaLocations.includes(cutoutId)

    const X_ADJUSTMENT_LEFT_SIDE = -101.5
    const X_ADJUSTMENT = -17
    const X_DIMENSION_MIDDLE_SLOTS = 160.3
    const X_DIMENSION_OUTER_SLOTS = hasStagingArea ? 160.0 : 246.5
    const X_DIMENSION_4TH_COLUMN_SLOTS = 175.0
    const Y_DIMENSION = hasTCOnSlot ? 294.0 : 106.0

    const slotFromCutout = slotId
    const isLeftSideofDeck =
      slotFromCutout === 'A1' ||
      slotFromCutout === 'B1' ||
      slotFromCutout === 'C1' ||
      slotFromCutout === 'D1'
    const xAdjustment = isLeftSideofDeck ? X_ADJUSTMENT_LEFT_SIDE : X_ADJUSTMENT
    const x = slotPosition[0] + xAdjustment

    const yAdjustment = -10
    const y = slotPosition[1] + yAdjustment

    const isMiddleOfDeck =
      slotId === 'A2' || slotId === 'B2' || slotId === 'C2' || slotId === 'D2'

    let xDimension = X_DIMENSION_OUTER_SLOTS
    if (isMiddleOfDeck) {
      xDimension = X_DIMENSION_MIDDLE_SLOTS
    } else if (FOURTH_COLUMN_SLOTS.includes(slotId)) {
      xDimension = X_DIMENSION_4TH_COLUMN_SLOTS
    }
    const yDimension = Y_DIMENSION

    return (
      <RobotCoordsForeignObject
        key="flex_blockedSlot"
        width={xDimension}
        height={yDimension}
        x={hasTCOnSlot ? x + 20 : x}
        y={hasTCOnSlot ? y - 70 : y}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{
          opacity: slotFillOpacity,
          flex: '1',
          zIndex: 10,
          cursor: 'pointer',
        }}
      >
        {slotFill}
      </RobotCoordsForeignObject>
    )
  } else {
    const y = slotPosition[1]
    const x = slotPosition[0]

    return (
      <RobotCoordsForeignObject
        key="ot2_blockedSlot"
        width={hasTCOnSlot ? 260 : 128}
        height={hasTCOnSlot ? 178 : 85}
        x={x}
        y={hasTCOnSlot ? y - 72 : y}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{
          opacity: slotFillOpacity,
          flex: '1',
          zIndex: 10,
          cursor: 'pointer',
        }}
      >
        {slotFill}
      </RobotCoordsForeignObject>
    )
  }
}
