import { getLabwareDefURI } from '@opentrons/shared-data'

import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'

// TOME TODO: Definitely understand how this works and see if it's necessary/can be simplified.
export function getLabwareDef(
  labwareId: string,
  protocolData: CompletedProtocolAnalysis
): LabwareDefinition2 | undefined {
  const labwareDefUri = protocolData.labware.find(l => l.id === labwareId)
    ?.definitionUri
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )
  return labwareDefinitions.find(def => getLabwareDefURI(def) === labwareDefUri)
}
