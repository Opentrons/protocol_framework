import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  LPC_STEP,
  selectActivePipette,
  selectSelectedLabwareFlowType,
  selectSelectedLabwareInfo,
} from '/app/redux/protocol-runs'
import { CheckItem } from './CheckItem'
import { LPCLabwareList } from './LPCLabwareList'
import { LPCLabwareDetails } from './LPCLabwareDetails'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function HandleLabware(props: LPCWizardContentProps): JSX.Element {
  const { commandUtils, proceedStep, runId } = props
  const {
    toggleRobotMoving,
    handleValidMoveToMaintenancePosition,
  } = commandUtils
  const { t } = useTranslation('labware_position_check')
  const pipette = useSelector(selectActivePipette(runId))

  const handleNavToDetachProbe = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleValidMoveToMaintenancePosition(pipette))
      .then(() => {
        proceedStep(LPC_STEP.DETACH_PROBE)
      })
      .finally(() => toggleRobotMoving(false))
  }

  // TODO(jh, 02-05-25): EXEC-1119. Use header overrides for the substeps.
  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      buttonText={t('exit')}
      onClickButton={handleNavToDetachProbe}
    >
      <HandleLabwareContent {...props} />
    </LPCContentContainer>
  )
}

function HandleLabwareContent(props: LPCWizardContentProps): JSX.Element {
  const selectedLw = useSelector(selectSelectedLabwareInfo(props.runId))
  const offsetFlowType = useSelector(selectSelectedLabwareFlowType(props.runId))

  // These routes are one step, since the progress bar remains static during the core LPC flow.
  if (selectedLw == null) {
    // The general labware list view.
    return <LPCLabwareList {...props} />
  } else if (selectedLw.offsetLocationDetails == null) {
    // The offset view for a singular labware geometry.
    return <LPCLabwareDetails {...props} />
  } else {
    // The core flow for updating an offset for a singular labware geometry.
    switch (offsetFlowType) {
      case 'default':
        return <CheckItem {...props} />
      case 'location-specific':
        return <CheckItem {...props} />
      default: {
        console.error(`Unexpected offsetFlowType: ${offsetFlowType}`)
        return <CheckItem {...props} />
      }
    }
  }
}
