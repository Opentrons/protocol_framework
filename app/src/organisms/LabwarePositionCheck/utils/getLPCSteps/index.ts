import { getProbeBasedLPCSteps } from './getProbeBasedLPCSteps'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'

export function getLPCSteps(
  protocolData: CompletedProtocolAnalysis
): LabwarePositionCheckStep[] {
  if ('pipettes' in protocolData) {
    if (protocolData.pipettes.length === 0) {
      throw new Error(
        'no pipettes loaded within protocol, labware position check cannot be performed'
      )
    } else {
      return getProbeBasedLPCSteps(protocolData)
    }
  } else {
    console.error('expected pipettes to be in protocol data')
    return []
  }
}
