import { useTranslation } from 'react-i18next'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCComplete(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { toggleRobotMoving, handleCleanUpAndClose } = props.commandUtils

  const handleClose = (): void => {
    void toggleRobotMoving(true).then(() => {
      void handleCleanUpAndClose()
    })
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      buttonText={t('exit')}
      onClickButton={handleClose}
    >
      <div>PLACEHOLDER LPC COMPLETE</div>
    </LPCContentContainer>
  )
}
