import path from 'path'
import glob from 'glob'
import { describe, expect, it, test } from 'vitest'

import type { LabwareDefinition3 } from '../types'
import Ajv from 'ajv'
import schema from '../../labware/schemas/3.json'

const fixturesDir = path.join(__dirname, '../../labware/fixtures/3')
const globPattern = '**/*.json'

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(schema)

const checkGeometryDefinitions = (
  labwareDef: LabwareDefinition3,
  filename: string
): void => {
  test('innerLabwareGeometry sections should be sorted top to bottom', () => {
    const geometries = Object.values(labwareDef.innerLabwareGeometry ?? [])
    for (const geometry of geometries) {
      const sectionList = geometry.sections
      const sortedSectionList = sectionList.toSorted(
        (a, b) => b.topHeight - a.topHeight
      )
      expect(sortedSectionList).toStrictEqual(sectionList)
    }
  })

  test(`all geometryDefinitionIds specified in {filename} should have an accompanying valid entry in innerLabwareGeometry`, () => {
    for (const wellName in labwareDef.wells) {
      const wellGeometryId = labwareDef.wells[wellName].geometryDefinitionId

      if (wellGeometryId === undefined) {
        return
      }
      if (
        labwareDef.innerLabwareGeometry === null ||
        labwareDef.innerLabwareGeometry === undefined
      ) {
        return
      }

      expect(wellGeometryId in labwareDef.innerLabwareGeometry).toBe(true)

      const wellDepth = labwareDef.wells[wellName].depth
      const topFrustumHeight =
        labwareDef.innerLabwareGeometry[wellGeometryId].sections[0].topHeight

      expect(wellDepth).toEqual(topFrustumHeight)
    }
  })
}

describe(`test additions to labware schema in v3`, () => {
  const labwarePaths = glob.sync(globPattern, { cwd: fixturesDir })

  test("definition paths didn't break, which would give false positives", () => {
    expect(labwarePaths.length).toBeGreaterThan(0)
  })

  describe.each(labwarePaths)('%s', labwarePath => {
    const filename = path.parse(labwarePath).base
    const fullLabwarePath = path.join(fixturesDir, labwarePath)
    const labwareDef = require(fullLabwarePath) as LabwareDefinition3

    it(`${filename} validates against schema`, () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors
      expect(validationErrors).toBe(null)
      expect(valid).toBe(true)
    })

    checkGeometryDefinitions(labwareDef, labwarePath)
  })
})
