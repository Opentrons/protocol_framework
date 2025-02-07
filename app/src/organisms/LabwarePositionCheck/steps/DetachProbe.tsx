import { useTranslation } from 'react-i18next'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function DetachProbe(props: LPCWizardContentProps): JSX.Element {
  const { proceedStep, goBackLastStep } = props
  const { t } = useTranslation('labware_position_check')

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      buttonText={t('confirm_removal')}
      onClickButton={() => {
        proceedStep()
      }}
      onClickBack={goBackLastStep}
    >
      <div>PLACEHOLDER DETACH PROBE</div>
    </LPCContentContainer>
  )
}
