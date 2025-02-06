import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { ProbeNotAttached } from '/app/organisms/PipetteWizardFlows/ProbeNotAttached'
import { getIsOnDevice } from '/app/redux/config'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

// TODO(jh, 02-05-25): EXEC-1190.
export function LPCProbeNotAttached(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { commandUtils } = props
  const { setShowUnableToDetect, headerCommands } = commandUtils
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      buttonText={t('try_again')}
      onClickButton={headerCommands.handleAttachProbeCheck}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: headerCommands.handleNavToDetachProbe,
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
