import { isEqual } from 'lodash'

import { getLabwareDefURI, getPipetteNameSpecs } from '@opentrons/shared-data'

import { STEP } from '/app/organisms/LabwarePositionCheck/constants'
import { getLabwareLocationCombos } from '/app/organisms/LegacyApplyHistoricOffsets/hooks/getLabwareLocationCombos'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  LoadedPipette,
} from '@opentrons/shared-data'
import type { CheckPositionsStep } from '/app/organisms/LabwarePositionCheck/types'
import type { LabwareLocationCombo } from '/app/organisms/LegacyApplyHistoricOffsets/hooks/getLabwareLocationCombos'

// export function getProbeBasedLPCSteps(
//   params: GetLPCStepsParams
// ): LabwarePositionCheckStep[] {
//   const { protocolData } = params
//
//   return [
//     { section: NAV_STEPS.BEFORE_BEGINNING },
//     {
//       section: NAV_STEPS.ATTACH_PROBE,
//       pipetteId: getPrimaryPipetteId(protocolData.pipettes),
//     },
//     ...getUniqueLabwareLocationComboInfo(params),
//     {
//       section: NAV_STEPS.DETACH_PROBE,
//       pipetteId: getPrimaryPipetteId(protocolData.pipettes),
//     },
//     { section: NAV_STEPS.RESULTS_SUMMARY },
//   ]
// }
export interface GetUniqueLocationComboInfoParams {
  protocolData: CompletedProtocolAnalysis | null
  labwareDefs: LabwareDefinition2[] | null
}

export function getUniqueLabwareLocationComboInfo({
  labwareDefs,
  protocolData,
}: GetUniqueLocationComboInfoParams): LabwareLocationCombo[] {
  if (protocolData == null || labwareDefs == null) {
    return []
  }

  const { commands, labware, modules = [] } = protocolData
  const labwareLocationCombos = getLabwareLocationCombos(
    commands,
    labware,
    modules
  )

  // Filter out duplicate labware and labware that is not LPC-able.
  return labwareLocationCombos.reduce<LabwareLocationCombo[]>(
    (acc, labwareLocationCombo) => {
      const labwareDef = labwareDefs.find(
        def => getLabwareDefURI(def) === labwareLocationCombo.definitionUri
      )
      if (
        (labwareDef?.allowedRoles ?? []).includes('adapter') ||
        (labwareDef?.allowedRoles ?? []).includes('lid')
      ) {
        return acc
      }
      // remove duplicate definitionUri in same location
      const comboAlreadyExists = acc.some(
        accLocationCombo =>
          labwareLocationCombo.definitionUri ===
            accLocationCombo.definitionUri &&
          isEqual(labwareLocationCombo.location, accLocationCombo.location)
      )
      return comboAlreadyExists ? acc : [...acc, labwareLocationCombo]
    },
    []
  )
}
