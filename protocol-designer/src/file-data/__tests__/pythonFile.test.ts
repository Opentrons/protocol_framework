import { describe, it, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
  fixture96Plate,
  fixtureTiprackAdapter,
} from '@opentrons/shared-data'
import {
  getLoadAdapters,
  getLoadLabware,
  getLoadModules,
  pythonMetadata,
  pythonRequirements,
} from '../selectors/pythonFile'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareEntities, TimelineFrame } from '@opentrons/step-generation'
import type { ModuleEntities } from '../../step-forms'

describe('pythonMetadata', () => {
  it('should generate metadata section', () => {
    expect(
      pythonMetadata({
        protocolName: 'Name of Protocol',
        author: 'Some Author',
        description: 'The description.',
        created: 1000000000000,
        lastModified: 1000000001000,
        category: 'PCR',
        subcategory: 'PCR Prep',
        tags: ['wombat', 'kangaroo', 'wallaby'],
      })
    ).toBe(
      `
metadata = {
    "protocolName": "Name of Protocol",
    "author": "Some Author",
    "description": "The description.",
    "created": "2001-09-09T01:46:40.000Z",
    "lastModified": "2001-09-09T01:46:41.000Z",
    "category": "PCR",
    "subcategory": "PCR Prep",
    "tags": "wombat, kangaroo, wallaby",
}`.trimStart()
    )
  })
})

describe('pythonRequirements', () => {
  it('should generate requirements section', () => {
    expect(pythonRequirements(OT2_ROBOT_TYPE)).toBe(
      `
requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.23",
}`.trimStart()
    )

    expect(pythonRequirements(FLEX_ROBOT_TYPE)).toBe(
      `
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}`.trimStart()
    )
  })
})

const moduleId = '1'
const moduleId2 = '2'
const moduleId3 = '3'
const mockModuleEntities: ModuleEntities = {
  [moduleId]: {
    id: moduleId,
    model: MAGNETIC_BLOCK_V1,
    type: MAGNETIC_BLOCK_TYPE,
    pythonName: 'magnetic_block_1',
  },
  [moduleId2]: {
    id: moduleId2,
    model: HEATERSHAKER_MODULE_V1,
    type: HEATERSHAKER_MODULE_TYPE,
    pythonName: 'heater_shaker_1',
  },
  [moduleId3]: {
    id: moduleId3,
    model: MAGNETIC_BLOCK_V1,
    type: MAGNETIC_BLOCK_TYPE,
    pythonName: 'magnetic_block_2',
  },
}
const labwareId1 = 'labwareId1'
const labwareId2 = 'labwareId2'
const labwareId3 = 'labwareId3'
const labwareId4 = 'labwareId4'
const labwareId5 = 'labwareId5'

const mockLabwareEntities: LabwareEntities = {
  [labwareId1]: {
    id: labwareId1,
    labwareDefURI: 'fixture/fixture_flex_96_tiprack_adapter/1',
    def: fixtureTiprackAdapter as LabwareDefinition2,
    pythonName: 'adapter_1',
  },
  [labwareId2]: {
    id: labwareId2,
    labwareDefURI: 'fixture/fixture_flex_96_tiprack_adapter/1',
    def: fixtureTiprackAdapter as LabwareDefinition2,
    pythonName: 'adapter_2',
  },
  [labwareId3]: {
    id: labwareId3,
    labwareDefURI: 'fixture/fixture_96_plate/1',
    def: fixture96Plate as LabwareDefinition2,
    pythonName: 'well_plate_1',
  },
  [labwareId4]: {
    id: labwareId4,
    labwareDefURI: 'fixture/fixture_96_plate/1',
    def: fixture96Plate as LabwareDefinition2,
    pythonName: 'well_plate_2',
  },
  [labwareId5]: {
    id: labwareId5,
    labwareDefURI: 'fixture/fixture_96_plate/1',
    def: fixture96Plate as LabwareDefinition2,
    pythonName: 'well_plate_3',
  },
}

const labwareRobotState: TimelineFrame['labware'] = {
  //  adapter on a module
  [labwareId1]: { slot: moduleId },
  //  adapter on a slot
  [labwareId2]: { slot: 'B2' },
  //  labware on an adapter on a slot
  [labwareId3]: { slot: labwareId2 },
  //  labware on a module
  [labwareId4]: { slot: moduleId3 },
  //  labware on a slot
  [labwareId5]: { slot: 'C2' },
}

describe('getLoadModules', () => {
  it('should generate loadModules', () => {
    const modules: TimelineFrame['modules'] = {
      [moduleId]: { slot: 'B1', moduleState: {} as any },
      [moduleId2]: { slot: 'A1', moduleState: {} as any },
      [moduleId3]: { slot: 'A2', moduleState: {} as any },
    }

    expect(getLoadModules(mockModuleEntities, modules)).toBe(
      `
# Load Modules:
magnetic_block_1 = protocol.load_module("magneticBlockV1", "B1")
heater_shaker_1 = protocol.load_module("heaterShakerModuleV1", "A1")
magnetic_block_2 = protocol.load_module("magneticBlockV1", "A2")`.trimStart()
    )
  })
})

describe('getLoadAdapters', () => {
  it('should generate loadAdapters for 2 adapters', () => {
    expect(
      getLoadAdapters(
        mockModuleEntities,
        mockLabwareEntities,
        labwareRobotState
      )
    ).toBe(
      `
# Load Adapters:
adapter_1 = magnetic_block_1.load_adapter("fixture_flex_96_tiprack_adapter")
adapter_2 = protocol.load_adapter("fixture_flex_96_tiprack_adapter", "B2")`.trimStart()
    )
  })
})

describe('getLoadLabware', () => {
  it('should generate loadLabware for 3 labware', () => {
    expect(
      getLoadLabware(mockModuleEntities, mockLabwareEntities, labwareRobotState)
    ).toBe(
      `
# Load Labware:
well_plate_1 = adapter_2.load_labware("fixture_96_plate")
well_plate_2 = magnetic_block_2.load_labware("fixture_96_plate")
well_plate_3 = protocol.load_labware("fixture_96_plate", "C2")`.trimStart()
    )
  })
})
