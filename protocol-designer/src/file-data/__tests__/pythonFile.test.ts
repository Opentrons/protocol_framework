import { describe, it, expect } from 'vitest'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { pythonMetadata, pythonRequirements } from '../selectors/pythonFile'

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
