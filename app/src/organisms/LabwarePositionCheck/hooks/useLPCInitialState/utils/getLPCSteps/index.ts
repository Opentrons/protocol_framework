import { getProbeBasedLPCSteps } from './getProbeBasedLPCSteps'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'

export interface GetLPCStepsParams {
  protocolData: CompletedProtocolAnalysis
  labwareDefs: LabwareDefinition2[]
}

// Prepare all LPC steps for injection.
export function getLPCSteps(
  params: GetLPCStepsParams
): LabwarePositionCheckStep[] {
  if ('pipettes' in params.protocolData) {
    if (params.protocolData.pipettes.length === 0) {
      throw new Error(
        'no pipettes loaded within protocol, labware position check cannot be performed'
      )
    } else {
      return getProbeBasedLPCSteps(params)
    }
  } else {
    console.error('expected pipettes to be in protocol data')
    return []
  }
}
