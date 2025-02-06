import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { ProbeNotAttached } from '/app/organisms/PipetteWizardFlows/ProbeNotAttached'
import { getIsOnDevice } from '/app/redux/config'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import { LPC_STEP, selectActivePipette } from '/app/redux/protocol-runs'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

// TODO(jh, 02-05-25): EXEC-1190.
export function LPCProbeNotAttached(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { commandUtils, proceedStep, runId } = props
  const {
    setShowUnableToDetect,
    toggleRobotMoving,
    handleValidMoveToMaintenancePosition,
    handleProbeAttachment,
  } = commandUtils
  const isOnDevice = useSelector(getIsOnDevice)
  const pipette = useSelector(selectActivePipette(runId))

  const handleAttachProbeCheck = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleProbeAttachment(pipette, proceedStep))
      .then(() => {
        proceedStep()
      })
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
      buttonText={t('try_again')}
      onClickButton={handleAttachProbeCheck}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: handleNavToDetachProbe,
      }}
    >
      <ProbeNotAttached
        handleOnClick={() => null}
        setShowUnableToDetect={setShowUnableToDetect}
        isOnDevice={isOnDevice}
      />
    </LPCContentContainer>
  )
}
