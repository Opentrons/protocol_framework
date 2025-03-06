import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  StyledText,
  PrimaryButton,
  Icon,
  COLORS,
  SPACING,
  BORDERS,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
} from '@opentrons/components'

export function ManageOffsetsBtn({
  isMissingDefaultOffset,
  onClick,
}: {
  isMissingDefaultOffset: boolean
  onClick: () => void
}): JSX.Element {
  const { t } = useTranslation('labware_position_check')

  return (
    <PrimaryButton
      onClick={onClick}
      css={CUSTOM_BTN_STYLE}
      backgroundColor={isMissingDefaultOffset ? '' : COLORS.blue35}
      color={isMissingDefaultOffset ? '' : COLORS.black90}
    >
      <Flex css={BUTTON_TEXT_CONTAINER_STYLE}>
        {isMissingDefaultOffset && <Icon name="add" css={ADD_ICON_STYLE} />}
        <StyledText oddStyle="bodyTextSemiBold">{t('add')}</StyledText>
      </Flex>
    </PrimaryButton>
  )
}

const CUSTOM_BTN_STYLE = css`
  padding: ${SPACING.spacing16} ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusFull};
`

const BUTTON_TEXT_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing8};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const ADD_ICON_STYLE = css`
  width: 1.75rem;
  height: 1.75rem;
`
