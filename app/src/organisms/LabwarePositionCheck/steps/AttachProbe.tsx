import { useTranslation } from 'react-i18next'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function AttachProbe(props: LPCWizardContentProps): JSX.Element {
  const {
    handleAttachProbeCheck,
    handleNavToDetachProbe,
  } = props.commandUtils.headerCommands
  const { t } = useTranslation('labware_position_check')

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      onClickButton={handleAttachProbeCheck}
      buttonText={t('continue')}
      secondaryButtonProps={{
        buttonText: t('exit'),
        buttonCategory: 'rounded',
        buttonType: 'tertiaryLowLight',
        onClick: handleNavToDetachProbe,
      }}
    >
      <div>PLACEHOLDER ATTACH PROBE</div>
    </LPCContentContainer>
  )
}
