import path from 'path'
import glob from 'glob'
import { describe, expect, it, test } from 'vitest'

import type { LabwareDefinition3 } from '../types'
import Ajv from 'ajv'
import schema from '../../labware/schemas/3.json'

const fixturesDir = path.join(__dirname, '../../labware/fixtures/3')
const definitionsDir = path.join(__dirname, '../../labware/definitions/3')
const globPattern = '**/*.json'

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(schema)

const checkGeometryDefinitions = (labwareDef: LabwareDefinition3): void => {
  test('all geometryDefinitionIds should have an accompanying valid entry in innerLabwareGeometry', () => {
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

      // FIXME(mm, 2025-02-04):
      // - `sections` is not necessarily sorted, so `sections[0]` is not necessarily the top.
      // - Even after solving that, `wellDepth` != `topFrustumHeight` for ~26/60 definitions.
      //
      // const wellDepth = labwareDef.wells[wellName].depth
      // const topFrustumHeight =
      //   labwareDef.innerLabwareGeometry[wellGeometryId].sections[0].topHeight
      // expect(wellDepth).toEqual(topFrustumHeight)
    }
  })
}

describe(`test labware definitions with schema v3`, () => {
  const definitionPaths = glob.sync(globPattern, {
    cwd: definitionsDir,
    absolute: true,
  })
  const fixturePaths = glob.sync(globPattern, {
    cwd: fixturesDir,
    absolute: true,
  })
  const allPaths = definitionPaths.concat(fixturePaths)

  test("paths didn't break, which would give false positives", () => {
    expect(definitionPaths.length).toBeGreaterThan(0)
    expect(fixturePaths.length).toBeGreaterThan(0)
  })

  describe.each(allPaths)('%s', labwarePath => {
    const labwareDef = require(labwarePath) as LabwareDefinition3

    it('validates against schema', () => {
      const valid = validate(labwareDef)
      const validationErrors = validate.errors

      // FIXME(mm, 2025-02-04): These new definitions have a displayCategory that
      // the schema does not recognized. Either they need to change or the schema does.
      const expectFailure = [
        'opentrons_flex_tiprack_lid',
        'opentrons_tough_pcr_auto_sealing_lid',
        'protocol_engine_lid_stack_object',
      ].includes(labwareDef.parameters.loadName)

      if (expectFailure) expect(validationErrors).not.toBe(null)
      else expect(validationErrors).toBe(null)
      expect(valid).toBe(!expectFailure)
    })

    checkGeometryDefinitions(labwareDef)
  })
})
