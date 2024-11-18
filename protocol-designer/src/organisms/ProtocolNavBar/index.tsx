import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  isntStyleProp,
  JUSTIFY_SPACE_BETWEEN,
  SecondaryButton,
  SPACING,
  StyledText,
  Tabs,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getFileMetadata } from '../../file-data/selectors'
import { selectTerminalItem } from '../../ui/steps/actions/actions'
import { LINE_CLAMP_TEXT_STYLE } from '../../atoms'
import { useKitchen } from '../Kitchen/hooks'
import { LiquidButton } from './LiquidButton'

import type { StyleProps, TabProps } from '@opentrons/components'

interface ProtocolNavBarProps {
  hasZoomInSlot?: boolean
  tabs?: TabProps[]
  hasTrashEntity?: boolean
  showLiquidOverflowMenu?: (liquidOverflowMenu: boolean) => void
  isAddingHardwareOrLabware?: boolean
  liquidPage?: boolean
  isOffDeck?: boolean
}

export function ProtocolNavBar({
  hasZoomInSlot,
  isAddingHardwareOrLabware = false,
  tabs = [],
  hasTrashEntity,
  showLiquidOverflowMenu,
  liquidPage = false,
  isOffDeck = false,
}: ProtocolNavBarProps): JSX.Element {
  const { t } = useTranslation('starting_deck_state')
  const metadata = useSelector(getFileMetadata)
  const { makeSnackbar } = useKitchen()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  return (
    <NavContainer>
      {hasZoomInSlot ? null : <Tabs tabs={tabs} />}

      <MetadataContainer isAddingHardwareOrLabware={isAddingHardwareOrLabware}>
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          css={LINE_CLAMP_TEXT_STYLE(1)}
          textAlign={isOffDeck && TYPOGRAPHY.textAlignLeft}
        >
          {metadata?.protocolName != null && metadata?.protocolName !== ''
            ? metadata?.protocolName
            : t('untitled_protocol')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
          textAlign={isOffDeck && TYPOGRAPHY.textAlignLeft}
        >
          {isAddingHardwareOrLabware || isOffDeck
            ? t('add_hardware_labware')
            : t('edit_protocol')}
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

const NavContainer = styled(Flex)`
  padding: ${SPACING.spacing12};
  width: 100%;
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
  box-shadow: 0px 1px 3px 0px ${COLORS.black90}${COLORS.opacity20HexCode};
`

interface MetadataProps extends StyleProps {
  isAddingHardwareOrLabware: boolean
}
const MetadataContainer = styled.div.withConfig<MetadataProps>({
  shouldForwardProp: p => isntStyleProp(p) && p !== 'isAddingHardwareOrLabware',
})<MetadataProps>`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  text-align: ${props =>
    props.isAddingHardwareOrLabware === true
      ? TYPOGRAPHY.textAlignLeft
      : TYPOGRAPHY.textAlignCenter};

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
