import { describe, it, expect } from 'vitest'
import {
  FLEX_ROBOT_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  pythonDefRun,
  pythonMetadata,
  pythonRequirements,
} from '../selectors/pythonFile'
import { InvariantContext, TimelineFrame } from '@opentrons/step-generation'

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
const mockInvariantContext: InvariantContext = {
  additionalEquipmentEntities: {},
  pipetteEntities: {},
  labwareEntities: {},
  liquidEntities: {},
  moduleEntities: {
    [moduleId]: {
      id: moduleId,
      model: MAGNETIC_BLOCK_V1,
      type: MAGNETIC_BLOCK_TYPE,
      pythonName: 'magnetic_block_1',
    },
  },
  config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: true },
}
const mockInitialRobotState: TimelineFrame = {
  pipettes: {},
  labware: {},
  modules: { [moduleId]: { slot: 'B1', moduleState: {} as any } },
  tipState: { tipracks: {}, pipettes: {} },
  liquidState: { pipettes: {}, labware: {}, additionalEquipment: {} },
}
describe('pythonDefRun', () => {
  it('should generate the commands section', () => {
    expect(pythonDefRun(mockInvariantContext, mockInitialRobotState)).toBe(
      `
def run(protocol: protocol_api.ProtocolContext):
    # Load Modules:
    magnetic_block_1 = protocol.load_module("magneticBlockV1", "B1")`.trimStart()
    )
  })
})
