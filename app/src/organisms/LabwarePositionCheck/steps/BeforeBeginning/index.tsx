import { Trans, useTranslation } from 'react-i18next'

import {
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  LegacyStyledText,
} from '@opentrons/components'

import { WizardRequiredEquipmentList } from '/app/molecules/WizardRequiredEquipmentList'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import { TwoUpTileLayout } from './TwoUpTileLayout'
import { ViewOffsets } from './ViewOffsets'
import { SmallButton } from '/app/atoms/buttons'

import type {
  LPCStepProps,
  BeforeBeginningStep,
} from '/app/organisms/LabwarePositionCheck/types'

// TODO(BC, 09/01/23): replace updated support article link for LPC on OT-2/Flex
const SUPPORT_PAGE_URL = 'https://support.opentrons.com/s/ot2-calibration'

export function BeforeBeginning({
  proceed,
  existingOffsets,
  commandUtils,
  state,
}: LPCStepProps<BeforeBeginningStep>): JSX.Element {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const { isOnDevice, protocolName, labwareDefs } = state
  const { createStartLPCHandler } = commandUtils

  const handleStartLPC = createStartLPCHandler(proceed)

  const requiredEquipmentList = [
    {
      loadName: t('all_modules_and_labware_from_protocol', {
        protocol_name: protocolName,
      }),
      displayName: t('all_modules_and_labware_from_protocol', {
        protocol_name: protocolName,
      }),
    },
  ]

  return (
    <TwoUpTileLayout
      title={t('shared:before_you_begin')}
      body={
        <Trans
          t={t}
          i18nKey="labware_position_check_description"
          components={{ block: <LegacyStyledText as="p" /> }}
        />
      }
      rightElement={
        <WizardRequiredEquipmentList equipmentList={requiredEquipmentList} />
      }
      footer={
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          {isOnDevice ? (
            <ViewOffsets
              existingOffsets={existingOffsets}
              labwareDefinitions={labwareDefs}
            />
          ) : (
            <NeedHelpLink href={SUPPORT_PAGE_URL} />
          )}
          {isOnDevice ? (
            <SmallButton
              buttonText={t('shared:get_started')}
              onClick={handleStartLPC}
            />
          ) : (
            <PrimaryButton onClick={handleStartLPC}>
              {i18n.format(t('shared:get_started'), 'capitalize')}
            </PrimaryButton>
          )}
        </Flex>
      }
    />
  )
}
