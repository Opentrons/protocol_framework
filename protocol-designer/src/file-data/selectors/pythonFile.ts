/** Generate sections of the Python file for fileCreator.ts */

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  formatPyDict,
  indentPyLines,
  InvariantContext,
  ModuleEntities,
  PROTOCOL_CONTEXT_NAME,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { FileMetadataFields } from '../types'
import type { RobotType } from '@opentrons/shared-data'

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

function getLoadModules(
  moduleEntities: ModuleEntities,
  moduleRobotState: TimelineFrame['modules']
): string[] {
  const pythonModules = Object.values(moduleEntities).reduce<string[]>(
    (acc, moduleEntity) => [
      ...acc,
      `${moduleEntity.pythonName} = ${PROTOCOL_CONTEXT_NAME}.load_module("${
        moduleEntity.model
      }", "${moduleRobotState[moduleEntity.id].slot}")`,
    ],
    []
  )
  return pythonModules
}

export function pythonDefRun(
  invariantContext: InvariantContext,
  robotState: TimelineFrame
): string {
  const loadModules = getLoadModules(
    invariantContext.moduleEntities,
    robotState.modules
  )
  const sections: string[] = [
    ...loadModules,
    // loadLabware(),
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
