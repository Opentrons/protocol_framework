import { describe, it, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  getLoadModules,
  pythonMetadata,
  pythonRequirements,
} from '../selectors/pythonFile'
import type { TimelineFrame } from '@opentrons/step-generation'
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

describe('getLoadModules', () => {
  it('should generate loadModules', () => {
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
    const modules: TimelineFrame['modules'] = {
      [moduleId]: { slot: 'B1', moduleState: {} as any },
      [moduleId2]: { slot: 'A1', moduleState: {} as any },
      [moduleId3]: { slot: 'A2', moduleState: {} as any },
    }

    expect(getLoadModules(mockModuleEntities, modules)).toBe(
      `# Load Modules:
magnetic_block_1 = protocol.load_module("magneticBlockV1", "B1")
heater_shaker_1 = protocol.load_module("heaterShakerModuleV1", "A1")
magnetic_block_2 = protocol.load_module("magneticBlockV1", "A2")`
    )
  })
})
