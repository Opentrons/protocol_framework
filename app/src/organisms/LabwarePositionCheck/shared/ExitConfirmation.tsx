import styled from 'styled-components'
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
import { useSelector } from 'react-redux'
import { getIsOnDevice } from '/app/redux/config'
import { SmallButton } from '/app/atoms/buttons'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export const ExitConfirmation = ({
  commandUtils,
}: LPCWizardContentProps): JSX.Element => {
  const { i18n, t } = useTranslation(['labware_position_check', 'shared'])
  const { confirmExitLPC, cancelExitLPC } = commandUtils

  const isOnDevice = useSelector(getIsOnDevice)
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        paddingX={SPACING.spacing32}
      >
        <Icon name="ot-alert" size={SIZE_3} color={COLORS.yellow50} />
        {isOnDevice ? (
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
      {isOnDevice ? (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            onClick={cancelExitLPC}
            buttonText={i18n.format(t('shared:go_back'), 'capitalize')}
            buttonType="secondary"
          />
          <SmallButton
            onClick={confirmExitLPC}
            buttonText={t('remove_calibration_probe')}
            buttonType="alert"
          />
        </Flex>
      ) : (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={ALIGN_CENTER}
        >
          <Flex gridGap={SPACING.spacing8}>
            <SecondaryButton onClick={cancelExitLPC}>
              {t('shared:go_back')}
            </SecondaryButton>
            <AlertPrimaryButton
              onClick={confirmExitLPC}
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
