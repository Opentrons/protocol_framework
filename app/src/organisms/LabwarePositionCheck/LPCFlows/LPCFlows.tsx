import { LPCWizardContainer } from '/app/organisms/LabwarePositionCheck/LPCWizardContainer'

import type {
  RobotType,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

export interface LPCFlowsProps {
  onCloseClick: () => void
  runId: string
  robotType: RobotType
  existingOffsets: LabwareOffset[]
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  protocolName: string
  maintenanceRunId: string
}

export function LPCFlows(props: LPCFlowsProps): JSX.Element {
  return <LPCWizardContainer {...props} />
}
