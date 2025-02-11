/** Generate sections of the Python file for fileCreator.ts */

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  formatPyDict,
  formatPyStr,
  indentPyLines,
  PROTOCOL_CONTEXT_NAME,
} from '@opentrons/step-generation'
import type {
  InvariantContext,
  LabwareEntities,
  ModuleEntities,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { RobotType } from '@opentrons/shared-data'
import type { FileMetadataFields } from '../types'

const PAPI_VERSION = '2.23' // latest version from api/src/opentrons/protocols/api_support/definitions.py

export function pythonImports(): string {
  return [
    'from contextlib import nullcontext as pd_step',
    'from opentrons import protocol_api',
  ].join('\n')
}

export function pythonMetadata(fileMetadata: FileMetadataFields): string {
  // FileMetadataFields has timestamps, lists, etc., but Python metadata dict can only contain strings
  function formatTimestamp(timestamp: number | null | undefined): string {
    return timestamp ? new Date(timestamp).toISOString() : ''
  }
  const stringifiedMetadata = Object.fromEntries(
    Object.entries({
      protocolName: fileMetadata.protocolName,
      author: fileMetadata.author,
      description: fileMetadata.description,
      created: formatTimestamp(fileMetadata.created),
      lastModified: formatTimestamp(fileMetadata.lastModified),
      category: fileMetadata.category,
      subcategory: fileMetadata.subcategory,
      tags: fileMetadata.tags?.length && fileMetadata.tags.join(', '),
    }).filter(([key, value]) => value) // drop blank entries
  )
  return `metadata = ${formatPyDict(stringifiedMetadata)}`
}

export function pythonRequirements(robotType: RobotType): string {
  const ROBOTTYPE_TO_PAPI_NAME = {
    // values from api/src/opentrons/protocols/parse.py
    [OT2_ROBOT_TYPE]: 'OT-2',
    [FLEX_ROBOT_TYPE]: 'Flex',
  }
  const requirements = {
    robotType: ROBOTTYPE_TO_PAPI_NAME[robotType],
    apiLevel: PAPI_VERSION,
  }
  return `requirements = ${formatPyDict(requirements)}`
}

export function getLoadModules(
  moduleEntities: ModuleEntities,
  moduleRobotState: TimelineFrame['modules']
): string {
  const hasModules = Object.keys(moduleEntities).length > 0
  const pythonModules = hasModules
    ? Object.values(moduleEntities)
        .map(module => {
          // pythonIdentifier (module.model) from api/src/opentrons/protocol_api/validation.py#L373
          return `${
            module.pythonName
          } = ${PROTOCOL_CONTEXT_NAME}.load_module(${formatPyStr(
            module.model
          )}, ${formatPyStr(moduleRobotState[module.id].slot)})`
        })
        .join('\n')
    : ''
  return hasModules ? `# Load Modules:\n${pythonModules}` : ''
}

export function getLoadAdapters(
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities,
  labwareRobotState: TimelineFrame['labware']
): string {
  const adapterEntities = Object.values(labwareEntities).filter(lw =>
    lw.def.allowedRoles?.includes('adapter')
  )
  const hasAdapters = Object.keys(adapterEntities).length > 0

  const pythonAdapters = hasAdapters
    ? Object.values(adapterEntities)
        .map(adapter => {
          const adapterSlot = labwareRobotState[adapter.id].slot
          const onModule = moduleEntities[adapterSlot] != null
          const location = onModule
            ? moduleEntities[adapterSlot].pythonName
            : PROTOCOL_CONTEXT_NAME
          const slotInfo = onModule ? '' : `, ${formatPyStr(adapterSlot)}`

          return `${
            adapter.pythonName
          } = ${location}.load_adapter(${formatPyStr(
            adapter.def.parameters.loadName
          )}${slotInfo})`
        })
        .join('\n')
    : ''

  return hasAdapters ? `# Load Adapters:\n${pythonAdapters}` : ''
}

export function getLoadLabware(
  moduleEntities: ModuleEntities,
  allLabwareEntities: LabwareEntities,
  labwareRobotState: TimelineFrame['labware']
): string {
  const labwareEntities = Object.values(allLabwareEntities).filter(
    lw => !lw.def.allowedRoles?.includes('adapter')
  )
  const hasLabware = Object.keys(labwareEntities).length > 0

  const pythonLabware = hasLabware
    ? Object.values(labwareEntities)
        .map(labware => {
          const labwareSlot = labwareRobotState[labware.id].slot
          const onModule = moduleEntities[labwareSlot] != null
          const onAdapter = allLabwareEntities[labwareSlot] != null
          let location = PROTOCOL_CONTEXT_NAME
          if (onAdapter) {
            location = allLabwareEntities[labwareSlot].pythonName
          } else if (onModule) {
            location = moduleEntities[labwareSlot].pythonName
          }
          const slotInfo =
            onModule || onAdapter ? '' : `, ${formatPyStr(labwareSlot)}`

          return `${
            labware.pythonName
          } = ${location}.load_labware(${formatPyStr(
            labware.def.parameters.loadName
          )}${slotInfo})`
        })
        .join('\n')
    : ''

  return hasLabware ? `# Load Labware:\n${pythonLabware}` : ''
}

export function pythonDefRun(
  invariantContext: InvariantContext,
  robotState: TimelineFrame
): string {
  const { moduleEntities, labwareEntities } = invariantContext
  const { modules, labware } = robotState
  const loadModules = getLoadModules(moduleEntities, modules)
  const loadAdapters = getLoadAdapters(moduleEntities, labwareEntities, labware)
  const loadLabware = getLoadLabware(moduleEntities, labwareEntities, labware)

  const sections: string[] = [
    loadModules,
    loadAdapters,
    loadLabware,
    // loadInstruments(),
    // defineLiquids(),
    // loadLiquids(),
    // stepCommands(),
  ]
  const functionBody =
    sections
      .filter(section => section) // skip empty sections
      .join('\n\n') || 'pass'
  return (
    `def run(${PROTOCOL_CONTEXT_NAME}: protocol_api.ProtocolContext):\n` +
    `${indentPyLines(functionBody)}`
  )
}
