import { getLabwareDefURI } from '@opentrons/shared-data'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'

interface GetLabwareDefsForLPCParams {
  labwareId: string
  loadedLabware: CompletedProtocolAnalysis['labware']
  labwareDefs: LabwareDefinition2[]
}

export function getItemLabwareDef({
  labwareId,
  loadedLabware,
  labwareDefs,
}: GetLabwareDefsForLPCParams): LabwareDefinition2 {
  const labwareDefUri = loadedLabware.find(l => l.id === labwareId)
    ?.definitionUri

  return labwareDefs.find(
    def => getLabwareDefURI(def) === labwareDefUri
  ) as LabwareDefinition2 // Safe assumption
}
