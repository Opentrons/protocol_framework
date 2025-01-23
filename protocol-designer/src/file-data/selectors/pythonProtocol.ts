import type { FileMetadataFields } from '../types'
import {
  FLEX_ROBOT_TYPE,
  LabwareDisplayCategory,
  OT2_ROBOT_TYPE,
  RobotType,
} from '@opentrons/shared-data'
import {
  LabwareEntities,
  RobotState,
  ModuleState,
  PipetteEntities,
  LabwareLiquidState,
  Timeline,
} from '@opentrons/step-generation'
import { ModuleEntities } from '../../step-forms'
import { LiquidGroupsById } from '../../labware-ingred/types'
import { StepArgsAndErrorsById } from '../../steplist'
import {
  genPyDict,
  genPyStr,
  indentLines,
} from '../../../../step-generation/src/utils/pythonUtils'

export default function genPythonProtocol(
  fileMetadata: FileMetadataFields,
  robotType: RobotType,
  robotState: RobotState,
  robotStateTimeline: Timeline,
  labwareEntities: LabwareEntities,
  labwareNicknamesById: Record<string, string>,
  moduleEntities: ModuleEntities,
  pipetteEntities: PipetteEntities,
  liquidGroups: LiquidGroupsById,
  liquidState: LabwareLiquidState
): string {
  return [
    genImports(),
    genMetadata(fileMetadata),
    genRequirements(robotType),
    genDefRun(
      robotState,
      labwareEntities,
      labwareNicknamesById,
      moduleEntities,
      pipetteEntities,
      liquidGroups,
      liquidState,
      robotStateTimeline
    ),
  ].join(`\n\n`)
}

export function genImports(): string {
  return [
    `from contextlib import nullcontext as pd_step`,
    `from opentrons import protocol_api`,
    // `from opentrons.types import Mount`,
  ].join(`\n`)
}

export function genMetadata(metadata: FileMetadataFields): string {
  // FileMetadataFields is not usable directly because Python only allows string fields, not numbers or None.
  const pythonMetadata = {
    ...(metadata.protocolName && { protocolName: metadata.protocolName }),
    ...(metadata.author && { author: metadata.author }),
    ...(metadata.description && { description: metadata.description }),
    ...(metadata.created && {
      created: new Date(metadata.created).toISOString(),
    }),
    ...(metadata.lastModified && {
      lastModified: new Date(metadata.lastModified).toISOString(),
    }),
    ...(metadata.category && { category: metadata.category }),
    ...(metadata.subcategory && { subcategory: metadata.subcategory }),
    ...(metadata.tags?.length && { tags: metadata.tags.join(`, `) }),
  }
  return `metadata = ${genPyDict(pythonMetadata)}`
}

export function genRequirements(robotType: RobotType): string {
  const ROBOTTYPE_TO_PAPI_NAME = {
    [OT2_ROBOT_TYPE]: 'OT-2',
    [FLEX_ROBOT_TYPE]: 'Flex',
  }
  const requirements = {
    robotType: ROBOTTYPE_TO_PAPI_NAME[robotType],
    apiLevel: '2.21',
  }
  return `requirements = ${genPyDict(requirements)}`
}

export function genDefRun(
  robotState: RobotState,
  labwareEntities: LabwareEntities,
  labwareNicknamesById: Record<string, string>,
  moduleEntities: ModuleEntities,
  pipetteEntities: PipetteEntities,
  liquidGroups: LiquidGroupsById,
  liquidState: LabwareLiquidState,
  robotStateTimeline: Timeline
): string {
  const protocolContextName = 'protocol'
  // Pick nice names for all the labware.
  const moduleIdToPythonName = pythonNamesForModules(robotState.modules)
  const labwareIdToPythonName = pythonNamesForLabware(
    robotState.labware,
    labwareEntities
  )
  const pipetteIdToPythonName = pythonNamesForPipettes(robotState.pipettes)
  const liquidIdToPythonName = pythonNamesForLiquids(liquidGroups)

  return `def run(${protocolContextName}: protocol_api.ProtocolContext):\n${indentLines(
    [
      genLoadModules(
        robotState.modules,
        moduleEntities,
        protocolContextName,
        moduleIdToPythonName
      ),
      genLoadLabware(
        robotState.labware,
        labwareEntities,
        labwareNicknamesById,
        protocolContextName,
        labwareIdToPythonName,
        moduleIdToPythonName
      ),
      genLoadInstruments(
        robotState.pipettes,
        pipetteEntities,
        protocolContextName,
        pipetteIdToPythonName,
        labwareIdToPythonName
      ),
      genDefineLiquids(liquidGroups, protocolContextName, liquidIdToPythonName),
      genLoadLiquids(
        liquidGroups,
        liquidState,
        labwareIdToPythonName,
        liquidIdToPythonName
      ),
      genStepCommands(robotStateTimeline),
    ].join(`\n\n`)
  )}`
}

export function genLoadModules(
  robotStateModules: RobotState['modules'],
  moduleEntities: ModuleEntities,
  protocolContextName: string,
  moduleIdToPythonName: Record<string, string>
): string {
  const loadModulesCode = Object.entries(robotStateModules)
    .map(
      ([moduleId, moduleProps]) =>
        `${
          moduleIdToPythonName[moduleId]
        } = ${protocolContextName}.load_module(${[
          genPyStr(moduleEntities[moduleId].model), // TODO: Find correct names!
          genPyStr(moduleProps.slot),
        ].join(`, `)})`
    )
    .join(`\n`)
  return `# Load modules.\n` + loadModulesCode
}

export function genLoadLabware(
  robotStateLabware: RobotState['labware'],
  labwareEntities: LabwareEntities,
  labwareNicknamesById: Record<string, string>,
  protocolContextName: string,
  labwareIdToPythonName: Record<string, string>,
  moduleIdToPythonName: Record<string, string>
): string {
  // From the robotStateLabware, we have to generate commands to load adapters, labware, trashbins.

  // Sort adapters before other modules because other modules can be loaded onto adapters:
  // Maybe it's already sorted?
  // const labwareWithAdaptersFirst = Object.entries(robotState.labware).toSorted(
  //   ([labwareAId], [labwareBId]) => {
  //     const labwareAIsAdapter = labwareEntities[labwareAId].def.allowedRoles?.includes('adapter');
  //     const labwareBIsAdapter = labwareEntities[labwareBId].def.allowedRoles?.includes('adapter');
  //     return +!!labwareBIsAdapter - +!!labwareAIsAdapter;  // ugh
  //   }
  // );

  const loadLabwareCode = Object.entries(robotStateLabware)
    .map(([labwareId, labwareProps]) => {
      const labwareEnt = labwareEntities[labwareId].def
      const isAdapter = labwareEnt.allowedRoles?.includes('adapter')
      const loadOnto =
        labwareIdToPythonName[labwareProps.slot] ||
        moduleIdToPythonName[labwareProps.slot]
      return (
        `${labwareIdToPythonName[labwareId]} = ${
          loadOnto || protocolContextName
        }.load_${isAdapter ? `adapter` : `labware`}(\n` +
        indentLines(
          [
            genPyStr(labwareEnt.parameters.loadName),
            ...(!loadOnto ? [genPyStr(labwareProps.slot)] : []),
            ...(!isAdapter && labwareNicknamesById[labwareId]
              ? [`label=${genPyStr(labwareNicknamesById[labwareId])}`]
              : []),
            `namespace=${genPyStr(labwareEnt.namespace)}`,
            `version=${labwareEnt.version}`,
          ].join(`,\n`)
        ) +
        `,\n)`
      )
    })
    .join(`\n`)

  // TODO: TRASH BINS!

  return `# Load labware.\n` + loadLabwareCode
}

// From _PIPETTE_NAMES_MAP in api/src/opentrons/protocol_api/validation.py:
const PIPETTE_NAME_TO_PAPI_LOAD_NAME = {
  p10_single: 'p10_single',
  p10_multi: 'p10_multi',
  p20_single_gen2: 'p20_single_gen2',
  p20_multi_gen2: 'p20_multi_gen2',
  p50_single: 'p50_single',
  p50_multi: 'p50_multi',
  p300_single: 'p300_single',
  p300_multi: 'p300_multi',
  p300_single_gen2: 'p300_single_gen2',
  p300_multi_gen2: 'p300_multi_gen2',
  p1000_single: 'p1000_single',
  p1000_single_gen2: 'p1000_single_gen2',
  p50_single_flex: 'flex_1channel_50',
  p50_multi_flex: 'flex_8channel_50',
  p1000_single_flex: 'flex_1channel_1000',
  p1000_multi_flex: 'flex_8channel_1000',
  p1000_multi_em_flex: 'flex_8channel_1000_em',
  p1000_96: 'flex_96channel_1000',
  p200_96: 'flex_96channel_200',
}

function genLoadInstruments(
  robotStatePipettes: RobotState['pipettes'],
  pipetteEntities: PipetteEntities,
  protocolContextName: string,
  pipetteIdToPythonName: Record<string, string>,
  labwareIdToPythonName: Record<string, string>
): string {
  console.log(robotStatePipettes, pipetteEntities)
  // The labwareIdToPythonName look like `UUID:tiprackURI`. We need the tiprackURI without the UUID.
  const labwareUriToPythonName = Object.fromEntries(
    Object.entries(labwareIdToPythonName).map(([labwareId, pythonName]) => [
      labwareId.replace(/^[^:]*:/, ''),
      pythonName,
    ])
  )
  const loadInstrumentsCode = Object.entries(robotStatePipettes)
    .map(([pipetteId, pipetteProps]) => {
      const pipetteEnt = pipetteEntities[pipetteId]
      return `${
        pipetteIdToPythonName[pipetteId]
      } = ${protocolContextName}.load_instrument(${[
        genPyStr(PIPETTE_NAME_TO_PAPI_LOAD_NAME[pipetteEnt.name]),
        genPyStr(pipetteProps.mount),
        ...(pipetteEnt.tiprackDefURI.length
          ? [
              `tip_racks=[${pipetteEnt.tiprackDefURI
                .map(tiprackId => labwareUriToPythonName[tiprackId])
                .join(`, `)}]`,
            ]
          : []),
      ].join(`, `)})`
    })
    .join(`\n`)
  return `# Load pipettes.\n` + loadInstrumentsCode
}

function genDefineLiquids(
  liquidGroups: LiquidGroupsById,
  protocolContextName: string,
  liquidIdToPythonName: Record<string, string>
): string {
  const defineLiquidsCode = Object.entries(liquidGroups)
    .map(([liquidId, liquidGroup]) => {
      return (
        `${liquidIdToPythonName[liquidId]} = ${protocolContextName}.define_liquid(\n` +
        indentLines(
          [
            genPyStr(liquidGroup.name || `Liquid ${liquidId}`),
            ...(liquidGroup.description
              ? [`description=${genPyStr(liquidGroup.description)}`]
              : []),
            ...(liquidGroup.displayColor
              ? [`display_color=${genPyStr(liquidGroup.displayColor)}`]
              : []),
          ].join(`,\n`)
        ) +
        `,\n)`
      )
    })
    .join(`\n`)
  return `# Define liquids.\n` + defineLiquidsCode
}

function genLoadLiquids(
  liquidGroups: LiquidGroupsById,
  liquidState: LabwareLiquidState,
  labwareIdToPythonName: Record<string, string>,
  liquidIdToPythonName: Record<string, string>
): string {
  const loadLiquidsCode = Object.entries(liquidState)
    .map(([labwareId, labwareLiquidState]) =>
      Object.entries(labwareLiquidState)
        .map(([well, wellLiquidState]) =>
          Object.entries(wellLiquidState)
            .map(
              ([liquidId, { volume }]) =>
                `${labwareIdToPythonName[labwareId]}[${genPyStr(
                  well
                )}].load_liquid(${liquidIdToPythonName[liquidId]}, ${volume})`
            )
            .join(`\n`)
        )
        .join(`\n`)
    )
    .join(`\n`)
  return `# Specify initial liquids in wells.\n` + loadLiquidsCode
}

export function genStepCommands(robotStateTimeline: Timeline): string {
  console.log('Robot state timeline', robotStateTimeline)
  return (
    `# PROTOCOL STEPS\n\n` +
    robotStateTimeline.timeline
      .map(
        (timelineFrame, idx) =>
          `# Step ${idx + 1}\n${timelineFrame.python || ''}`
      )
      .join('\n\n')
  )
}

function pythonNamesForLabware(
  robotStateLabware: RobotState['labware'],
  labwareEntities: LabwareEntities
): Record<string, string> {
  // We will use names like `wellplate_1`, where `wellplate` are the types from LabwareDisplayCategory.
  const labwareIds = Object.keys(robotStateLabware)
  const labwareCountsByCategory: Partial<
    Record<LabwareDisplayCategory, number>
  > = labwareIds
    .map(labwareId => labwareEntities[labwareId].def.metadata.displayCategory)
    .reduce<Partial<Record<LabwareDisplayCategory, number>>>(
      (counts, category) => {
        counts[category] = (counts[category] ?? 0) + 1
        return counts
      },
      {}
    )
  const labwareIdxByCategory: Partial<
    Record<LabwareDisplayCategory, number>
  > = {}
  return Object.fromEntries(
    labwareIds.map(labwareId => {
      const category = labwareEntities[labwareId].def.metadata.displayCategory
      const countForCategory = labwareCountsByCategory[category] ?? 0
      const idx = (labwareIdxByCategory[category] =
        (labwareIdxByCategory[category] ?? 0) + 1)
      return [
        labwareId,
        category.toLowerCase() + (countForCategory > 1 ? `_${idx}` : ''),
      ]
    })
  )
}

function pythonNamesForModules(
  robotStateModules: RobotState['modules']
): Record<string, string> {
  // We will use names like `wellplate_1`, where `wellplate` are the types from LabwareDisplayCategory.
  const moduleCountsByType = Object.values(robotStateModules)
    .map(module => module.moduleState.type)
    .reduce<Partial<Record<ModuleState['type'], number>>>(
      (counts, moduleType) => {
        counts[moduleType] = (counts[moduleType] ?? 0) + 1
        return counts
      },
      {}
    )
  const moduleIdxByType: Partial<Record<ModuleState['type'], number>> = {}
  return Object.fromEntries(
    Object.entries(robotStateModules).map(([moduleId, module]) => {
      const moduleType = module.moduleState.type
      const countForType = moduleCountsByType[moduleType] ?? 0
      const idx = (moduleIdxByType[moduleType] =
        (moduleIdxByType[moduleType] ?? 0) + 1)
      const pythonModuleType = (moduleType.endsWith('Type')
        ? moduleType.slice(0, -4)
        : moduleType
      )
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
      return [moduleId, pythonModuleType + (countForType > 1 ? `_${idx}` : '')]
    })
  )
}

function pythonNamesForPipettes(
  robotStatePipettes: RobotState['pipettes']
): Record<string, string> {
  // If 1 pipette, just call it `pipette`, else call them `pipette_left` and `pipette_right`.
  const pipetteEntries = Object.entries(robotStatePipettes)
  if (pipetteEntries.length === 0) {
    return {}
  } else if (pipetteEntries.length === 1) {
    const [pipetteId] = pipetteEntries[0]
    return { [pipetteId]: 'pipette' }
  } else {
    return Object.fromEntries(
      pipetteEntries.map(([pipetteId, pipette]) => [
        pipetteId,
        `pipette_${pipette.mount}`,
      ])
    )
  }
}

function pythonNamesForLiquids(
  liquidGroups: LiquidGroupsById
): Record<string, string> {
  // TODO: Do something fancier
  return Object.fromEntries(
    Object.entries(liquidGroups).map(([liquidId, liquidGroup]) => [
      liquidId,
      `liquid_${parseInt(liquidId) + 1}`,
    ])
  )
}
