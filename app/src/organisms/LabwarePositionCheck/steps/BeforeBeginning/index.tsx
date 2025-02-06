import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

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
import { getIsOnDevice } from '/app/redux/config'
import {
  LPC_STEP,
  selectActivePipette,
  selectLabwareOffsetsForAllLw,
} from '/app/redux/protocol-runs'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { State } from '/app/redux/types'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

// TODO(BC, 09/01/23): replace updated support article link for LPC on OT-2/Flex
const SUPPORT_PAGE_URL = 'https://support.opentrons.com/s/ot2-calibration'

export function BeforeBeginning(props: LPCWizardContentProps): JSX.Element {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const { runId, proceedStep, commandUtils } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const activePipette = useSelector(selectActivePipette(runId))
  const existingOffsets = useSelector(selectLabwareOffsetsForAllLw(runId))
  const pipette = useSelector(selectActivePipette(runId))
  const { protocolName, labwareDefs } = useSelector(
    (state: State) => state.protocolRuns[runId]?.lpc
  ) ?? { protocolName: '', labwareDefs: [] }
  const {
    handleStartLPC,
    toggleRobotMoving,
    handleValidMoveToMaintenancePosition,
  } = commandUtils

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

  const handleProceed = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleStartLPC(activePipette, proceedStep))
      .finally(() => toggleRobotMoving(false))
  }

  const handleNavToDetachProbe = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleValidMoveToMaintenancePosition(pipette))
      .then(() => {
        proceedStep(LPC_STEP.DETACH_PROBE)
      })
      .finally(() => toggleRobotMoving(false))
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      buttonText={t('continue')}
      onClickButton={handleProceed}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: handleNavToDetachProbe,
      }}
    >
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
                onClick={handleProceed}
              />
            ) : (
              <PrimaryButton onClick={handleProceed}>
                {i18n.format(t('shared:get_started'), 'capitalize')}
              </PrimaryButton>
            )}
          </Flex>
        }
      />
    </LPCContentContainer>
  )
}
