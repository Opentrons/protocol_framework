import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  Btn,
  TYPOGRAPHY,
  ToggleGroup,
  Box,
} from '@opentrons/components'

import { BUTTON_LINK_STYLE } from '../../atoms'
import { DeckThumbnail } from './DeckThumbnail'
import { OffDeckThumbnail } from './OffdeckThumbnail'
import { SlotDetailsContainer } from '../../organisms'

import type { Dispatch, SetStateAction } from 'react'
import type { RobotType } from '@opentrons/shared-data'

interface StartingDeckProps {
  setShowMaterialsListModal: (showMaterialsListModal: boolean) => void
  leftString: string
  rightString: string
  robotType: RobotType
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  isOffDeckHover: boolean
}

export function StartingDeck({
  setShowMaterialsListModal,
  leftString,
  rightString,
  robotType,
  hover,
  setHover,
  isOffDeckHover,
}: StartingDeckProps): JSX.Element {
  const { t } = useTranslation('protocol_overview')

  const [deckView, setDeckView] = useState<string>(leftString)

  return (
    <>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
          <StyledText desktopStyle="headingSmallBold">
            {t('starting_deck')}
          </StyledText>
          <Flex padding={SPACING.spacing4}>
            <Btn
              data-testid="Materials_list"
              textDecoration={TYPOGRAPHY.textDecorationUnderline}
              onClick={() => {
                setShowMaterialsListModal(true)
              }}
              css={BUTTON_LINK_STYLE}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('materials_list')}
              </StyledText>
            </Btn>
          </Flex>
        </Flex>
        <ToggleGroup
          selectedValue={deckView}
          leftText={leftString}
          rightText={rightString}
          leftClick={() => {
            setDeckView(leftString)
          }}
          rightClick={() => {
            setDeckView(rightString)
          }}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        alignItems={ALIGN_CENTER}
      >
        {deckView === leftString ? (
          <DeckThumbnail hoverSlot={hover} setHoverSlot={setHover} />
        ) : (
          <OffDeckThumbnail hover={hover} setHover={setHover} width="100%" />
        )}
        <Box width="100%" height="12.5rem">
          <SlotDetailsContainer
            robotType={robotType}
            slot={isOffDeckHover ? 'offDeck' : hover}
            offDeckLabwareId={isOffDeckHover ? hover : null}
          />
        </Box>
      </Flex>
    </>
  )
}
