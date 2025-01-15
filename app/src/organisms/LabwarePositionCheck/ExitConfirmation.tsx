import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  RESPONSIVENESS,
  SecondaryButton,
  SIZE_3,
  SPACING,
  LegacyStyledText,
  TEXT_ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function ExitConfirmation({
  commandUtils,
  state,
}: LPCWizardContentProps): JSX.Element {
  const { i18n, t } = useTranslation(['labware_position_check', 'shared'])
  const { confirmExitLPC, cancelExitLPC, toggleRobotMoving } = commandUtils

  const handleConfirmExit = (): void => {
    toggleRobotMoving(true).then(() => {
      confirmExitLPC()
    })
  }

  return (
    <Flex css={CONTAINER_STYLE}>
      <Flex css={CONTENT_CONTAINER_STYLE}>
        <Icon name="ot-alert" size={SIZE_3} color={COLORS.yellow50} />
        {state.isOnDevice ? (
          <>
            <ConfirmationHeaderODD>
              {t('remove_probe_before_exit')}
            </ConfirmationHeaderODD>
            <Flex textAlign={TEXT_ALIGN_CENTER}>
              <ConfirmationBodyODD>
                {t('exit_screen_subtitle')}
              </ConfirmationBodyODD>
            </Flex>
          </>
        ) : (
          <>
            <ConfirmationHeader>
              {t('remove_probe_before_exit')}
            </ConfirmationHeader>
            <LegacyStyledText as="p" marginTop={SPACING.spacing8}>
              {t('exit_screen_subtitle')}
            </LegacyStyledText>
          </>
        )}
      </Flex>
      {state.isOnDevice ? (
        <Flex css={BUTTON_CONTAINER_STYLE_ODD}>
          <SmallButton
            onClick={cancelExitLPC}
            buttonText={i18n.format(t('shared:go_back'), 'capitalize')}
            buttonType="secondary"
          />
          <SmallButton
            onClick={handleConfirmExit}
            buttonText={t('remove_calibration_probe')}
            buttonType="alert"
          />
        </Flex>
      ) : (
        <Flex css={BUTTON_CONTAINER_STYLE}>
          <Flex gridGap={SPACING.spacing8}>
            <SecondaryButton onClick={cancelExitLPC}>
              {t('shared:go_back')}
            </SecondaryButton>
            <AlertPrimaryButton
              onClick={handleConfirmExit}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('remove_calibration_probe')}
            </AlertPrimaryButton>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  padding: ${SPACING.spacing32};
  min-height: 29.5rem;
`

const CONTENT_CONTAINER_STYLE = css`
  flex: 1;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  padding-left: ${SPACING.spacing32};
  padding-right: ${SPACING.spacing32};
`

const BUTTON_CONTAINER_STYLE = css`
  width: 100%;
  margin-top: ${SPACING.spacing32};
  justify-content: ${JUSTIFY_FLEX_END};
  align-items: ${ALIGN_CENTER};
`

const BUTTON_CONTAINER_STYLE_ODD = css`
  width: 100%;
  justify-content: ${JUSTIFY_FLEX_END};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing8};
`

const ConfirmationHeader = styled.h1`
  margin-top: ${SPACING.spacing24};
  ${TYPOGRAPHY.h1Default}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

const ConfirmationHeaderODD = styled.h1`
  margin-top: ${SPACING.spacing24};
  ${TYPOGRAPHY.level3HeaderBold}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

const ConfirmationBodyODD = styled.h1`
  ${TYPOGRAPHY.level4HeaderRegular}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderRegular}
  }
  color: ${COLORS.grey60};
`
