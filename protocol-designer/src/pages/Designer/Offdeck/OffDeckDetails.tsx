import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  OVERFLOW_SCROLL,
  RobotWorkSpace,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { wellFillFromWellContents } from '../../../components/labware'
import { selectors } from '../../../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { DeckItemHover } from '../DeckSetup/DeckItemHover'
import { SlotDetailsContainer } from '../../../organisms'
import { getRobotType } from '../../../file-data/selectors'
import { SlotOverflowMenu } from '../DeckSetup/SlotOverflowMenu'
import type { DeckSlotId } from '@opentrons/shared-data'

interface OffDeckDetailsProps {
  addLabware: () => void
}
export function OffDeckDetails(props: OffDeckDetailsProps): JSX.Element {
  const { addLabware } = props
  const { t, i18n } = useTranslation('starting_deck_state')
  const [hoverSlot, setHoverSlot] = React.useState<DeckSlotId | null>(null)
  const [menuListId, setShowMenuListForId] = React.useState<DeckSlotId | null>(
    null
  )
  const robotType = useSelector(getRobotType)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const offDeckLabware = Object.values(deckSetup.labware).filter(
    lw => lw.slot === 'offDeck'
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )

  return (
    <Flex
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius8}
      width="100%"
      height="70vh"
      padding={`${SPACING.spacing40} ${SPACING.spacing24}`}
      justifyContent={JUSTIFY_CENTER}
      gridGap={SPACING.spacing24}
    >
      {hoverSlot != null ? (
        <Flex width="17.625rem" height="6.25rem" marginTop="4.75rem">
          <SlotDetailsContainer
            robotType={robotType}
            slot="offDeck"
            offDeckLabwareId={hoverSlot}
          />
        </Flex>
      ) : null}
      <Flex
        marginRight="17.375rem"
        marginLeft={hoverSlot ? '0' : '17.375rem'}
        width="100%"
        borderRadius={SPACING.spacing12}
        padding={`${SPACING.spacing16} ${SPACING.spacing40}`}
        backgroundColor={COLORS.grey20}
        height="100%"
        overflowY={OVERFLOW_SCROLL}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          color={COLORS.grey60}
          marginBottom={SPACING.spacing40}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {i18n.format(t('off_deck_labware'), 'uppercase')}
          </StyledText>
        </Flex>

        <Flex flexWrap={WRAP} gridGap={SPACING.spacing32}>
          {offDeckLabware.map(lw => {
            const wellContents = allWellContentsForActiveItem
              ? allWellContentsForActiveItem[lw.id]
              : null
            const definition = lw.def
            const { dimensions } = definition
            const xyzDimensions = {
              xDimension: dimensions.xDimension ?? 0,
              yDimension: dimensions.yDimension ?? 0,
              zDimension: dimensions.zDimension ?? 0,
            }
            return (
              <Flex flexDirection={DIRECTION_COLUMN} key={lw.id}>
                <RobotWorkSpace
                  key={lw.id}
                  viewBox={`${definition.cornerOffsetFromSlot.x} ${definition.cornerOffsetFromSlot.y} ${dimensions.xDimension} ${dimensions.yDimension}`}
                  width="9.5625rem"
                  height="6.375rem"
                >
                  {() => (
                    <>
                      <LabwareRender
                        definition={definition}
                        wellFill={wellFillFromWellContents(
                          wellContents,
                          liquidDisplayColors
                        )}
                      />
                      <DeckItemHover
                        hover={hoverSlot}
                        setShowMenuListForId={setShowMenuListForId}
                        menuListId={menuListId}
                        setHover={setHoverSlot}
                        slotBoundingBox={xyzDimensions}
                        slotPosition={[0, 0, 0]}
                        itemId={lw.id}
                        selectedTerminalItemId={START_TERMINAL_ITEM_ID}
                      />
                    </>
                  )}
                </RobotWorkSpace>
                {menuListId === lw.id ? (
                  // TODO fix this rendering position
                  <Flex
                    marginTop={`-${SPACING.spacing32}`}
                    marginLeft="4rem"
                    zIndex={3}
                  >
                    <SlotOverflowMenu
                      slot={menuListId}
                      addEquipment={addLabware}
                      setShowMenuList={() => {
                        setShowMenuListForId(null)
                      }}
                    />
                  </Flex>
                ) : null}
              </Flex>
            )
          })}
          <Flex width="9.5625rem" height="6.375rem">
            <EmptySelectorButton
              onClick={addLabware}
              text={t('add_labware')}
              textAlignment="middle"
              size="large"
              iconName="plus"
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}