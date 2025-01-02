import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { LPCWizardFlex } from './LPCWizardFlex'
import { LegacyLabwarePositionCheck } from '/app/organisms/LegacyLabwarePositionCheck'

import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'

export function LPCWizardContainer(props: LPCFlowsProps): JSX.Element {
  return props.robotType === FLEX_ROBOT_TYPE ? (
    <LPCWizardFlex {...props} />
  ) : (
    <LPCLegacyAdapter {...props} />
  )
}

function LPCLegacyAdapter(props: LPCFlowsProps): JSX.Element {
  const {
    setMaintenanceRunId,
    maintenanceRunId,
    isDeletingMaintenanceRun,
  } = props.maintenanceRunUtils

  return (
    <LegacyLabwarePositionCheck
      {...props}
      setMaintenanceRunId={setMaintenanceRunId}
      maintenanceRunId={maintenanceRunId}
      isDeletingMaintenanceRun={isDeletingMaintenanceRun}
    />
  )
}
