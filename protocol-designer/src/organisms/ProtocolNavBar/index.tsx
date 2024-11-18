import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  SecondaryButton,
  SPACING,
  StyledText,
  Tabs,
  TEXT_ALIGN_LEFT,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getFileMetadata } from '../../file-data/selectors'
import { selectTerminalItem } from '../../ui/steps/actions/actions'
import { LINE_CLAMP_TEXT_STYLE } from '../../atoms'
import { useKitchen } from '../Kitchen/hooks'
import { LiquidButton } from './LiquidButton'

import type { TabProps } from '@opentrons/components'

interface ProtocolNavBarProps {
  hasZoomInSlot?: boolean
  tabs?: TabProps[]
  hasTrashEntity?: boolean
  showLiquidOverflowMenu?: (liquidOverflowMenu: boolean) => void
  liquidPage?: boolean
}

export function ProtocolNavBar({
  hasZoomInSlot,
  tabs = [],
  hasTrashEntity,
  showLiquidOverflowMenu,
  liquidPage = false,
}: ProtocolNavBarProps): JSX.Element {
  const { t } = useTranslation('starting_deck_state')
  const metadata = useSelector(getFileMetadata)
  const { makeSnackbar } = useKitchen()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const showProtocolEditButtons = !(hasZoomInSlot || liquidPage)

  let metadataText = t('edit_protocol')
  if (liquidPage) {
    metadataText = t('add_liquid')
  } else if (hasZoomInSlot) {
    metadataText = t('add_hardware_labware')
  }
  return (
    <NavContainer showShadow={!showProtocolEditButtons}>
      {showProtocolEditButtons ? <Tabs tabs={tabs} /> : null}

      <MetadataContainer showProtocolEditButtons={showProtocolEditButtons}>
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          css={LINE_CLAMP_TEXT_STYLE(1)}
        >
          {metadata?.protocolName != null && metadata?.protocolName !== ''
            ? metadata?.protocolName
            : t('untitled_protocol')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {metadataText}
        </StyledText>
      </MetadataContainer>

      <ButtonGroup>
        {showLiquidOverflowMenu != null ? (
          <LiquidButton showLiquidOverflowMenu={showLiquidOverflowMenu} />
        ) : null}

        {liquidPage ? null : (
          <SecondaryButton
            onClick={() => {
              if (hasTrashEntity) {
                navigate('/overview')
                dispatch(selectTerminalItem('__initial_setup__'))
              } else {
                makeSnackbar(t('trash_required') as string)
              }
            }}
          >
            {t('shared:done')}
          </SecondaryButton>
        )}
      </ButtonGroup>
    </NavContainer>
  )
}

const NavContainer = styled(Flex)<{ showShadow: boolean }>`
  z-index: 11;
  padding: ${SPACING.spacing12};
  width: 100%;
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  box-shadow: ${props =>
    props.showShadow
      ? `0px 1px 3px 0px ${COLORS.black90}${COLORS.opacity20HexCode}`
      : 'none'};
`

const MetadataContainer = styled(Flex)<{ showProtocolEditButtons: boolean }>`
  flex-direction: ${DIRECTION_COLUMN};
  text-align: ${({ showProtocolEditButtons }) =>
    showProtocolEditButtons
      ? TYPOGRAPHY.textAlignCenter
      : TYPOGRAPHY.textAlignLeft};

  // For screens between 600px and 767px, set width to 88px
  @media only screen and (max-width: 767px) {
    width: 88px;
  }

  // For screens between 768px and 1023px, set width to 256px
  @media only screen and (min-width: 768px) and (max-width: 1023px) {
    width: 256px;
  }

  // For screens larger than or equal to 1024px, set width to 400px
  @media only screen and (min-width: 1024px) {
    width: 400px;
  }
`

const ButtonGroup = styled(Flex)`
  grid-gap: ${SPACING.spacing8};
`
