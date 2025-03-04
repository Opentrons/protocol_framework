import path from 'path'
import glob from 'glob'
import { describe, expect, it, test } from 'vitest'

import Ajv from 'ajv'

import type { InnerWellGeometry, LabwareDefinition3 } from '../types'
import schema from '../../labware/schemas/3.json'
import { SHARED_GEOMETRY_GROUPS } from './sharedGeometryGroups'
import {
  getAllDefinitions,
  getAllLabwareDefs,
  getAllLegacyDefinitions,
} from '../labware'

const fixturesDir = path.join(__dirname, '../../labware/fixtures/3')
const definitionsDir = path.join(__dirname, '../../labware/definitions/3')
const globPattern = '**/*.json'

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
const validate = ajv.compile(schema)

const checkGeometryDefinitions = (labwareDef: LabwareDefinition3): void => {
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
      // `wellDepth` != `topFrustumHeight` for ~23/60 definitions.
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
      // the schema does not recognize. Either they need to change or the schema does.
      const expectFailure = ['protocol_engine_lid_stack_object'].includes(
        labwareDef.parameters.loadName
      )

      if (expectFailure) expect(validationErrors).not.toBe(null)
      else expect(validationErrors).toBe(null)
      expect(valid).toBe(!expectFailure)
    })

    checkGeometryDefinitions(labwareDef)
  })
})

describe('check groups of labware that should have the same geometry', () => {
  describe.each(
    Object.entries(SHARED_GEOMETRY_GROUPS).map(([groupName, groupEntries]) => ({
      groupName,
      groupEntries,
    }))
  )('$groupName', ({ groupEntries }) => {
    const normalizedGroupEntries = groupEntries.map(entry => ({
      loadName: typeof entry === 'string' ? entry : entry.loadName,
      geometryKey: typeof entry === 'string' ? undefined : entry.geometryKey,
    }))
    test.each(normalizedGroupEntries)(
      '$loadName',
      ({ loadName, geometryKey }) => {
        // We arbitrarily pick the first labware in the group to compare the rest against.
        const otherLabwareGeometry = getGeometry(
          normalizedGroupEntries[0].loadName,
          normalizedGroupEntries[0].geometryKey
        )
        const thisLabwareGeometry = getGeometry(loadName, geometryKey)
        expect(thisLabwareGeometry).toEqual(otherLabwareGeometry)
      }
    )
  })
})

describe('labware listings', () => {
  // URIs to definitions
  const getAllDefinitionsResult = getAllDefinitions()

  // Arbitrary JS names to definitions
  const getAllLabwareDefsResult = getAllLabwareDefs()

  // v1 definition names to definitions
  const getAllLegacyDefinitionsResult = getAllLegacyDefinitions()

  test('getAllDefinitions', () => {
    expect(
      Object.keys(getAllDefinitionsResult).toSorted(),
      'getAllDefinitions'
    ).toStrictEqual(
      [
        'opentrons/agilent_1_reservoir_290ml/1',
        'opentrons/appliedbiosystemsmicroamp_384_wellplate_40ul/1',
        'opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/1',
        'opentrons/armadillo_96_wellplate_200ul_pcr_full_skirt/2',
        'opentrons/axygen_1_reservoir_90ml/1',
        'opentrons/biorad_384_wellplate_50ul/1',
        'opentrons/biorad_384_wellplate_50ul/2',
        'opentrons/biorad_96_wellplate_200ul_pcr/1',
        'opentrons/biorad_96_wellplate_200ul_pcr/2',
        'opentrons/corning_12_wellplate_6.9ml_flat/1',
        'opentrons/corning_12_wellplate_6.9ml_flat/2',
        'opentrons/corning_24_wellplate_3.4ml_flat/1',
        'opentrons/corning_24_wellplate_3.4ml_flat/2',
        'opentrons/corning_384_wellplate_112ul_flat/1',
        'opentrons/corning_384_wellplate_112ul_flat/2',
        'opentrons/corning_48_wellplate_1.6ml_flat/1',
        'opentrons/corning_48_wellplate_1.6ml_flat/2',
        'opentrons/corning_6_wellplate_16.8ml_flat/1',
        'opentrons/corning_6_wellplate_16.8ml_flat/2',
        'opentrons/corning_96_wellplate_360ul_flat/1',
        'opentrons/corning_96_wellplate_360ul_flat/2',
        'opentrons/eppendorf_96_tiprack_1000ul_eptips/1',
        'opentrons/eppendorf_96_tiprack_10ul_eptips/1',
        'opentrons/geb_96_tiprack_1000ul/1',
        'opentrons/geb_96_tiprack_10ul/1',
        'opentrons/nest_12_reservoir_15ml/1',
        'opentrons/nest_1_reservoir_195ml/1',
        'opentrons/nest_1_reservoir_195ml/2',
        'opentrons/nest_1_reservoir_290ml/1',
        'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/2',
        'opentrons/nest_96_wellplate_200ul_flat/1',
        'opentrons/nest_96_wellplate_200ul_flat/2',
        'opentrons/nest_96_wellplate_2ml_deep/1',
        'opentrons/nest_96_wellplate_2ml_deep/2',
        'opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical/1',
        'opentrons/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic/1',
        'opentrons/opentrons_10_tuberack_nest_4x50ml_6x15ml_conical/1',
        'opentrons/opentrons_15_tuberack_falcon_15ml_conical/1',
        'opentrons/opentrons_15_tuberack_nest_15ml_conical/1',
        'opentrons/opentrons_1_trash_3200ml_fixed/1',
        'opentrons/opentrons_1_trash_1100ml_fixed/1',
        'opentrons/opentrons_1_trash_850ml_fixed/1',
        'opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/1',
        'opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/2',
        'opentrons/opentrons_24_aluminumblock_nest_0.5ml_screwcap/1',
        'opentrons/opentrons_24_aluminumblock_nest_1.5ml_screwcap/1',
        'opentrons/opentrons_24_aluminumblock_nest_1.5ml_snapcap/1',
        'opentrons/opentrons_24_aluminumblock_nest_2ml_screwcap/1',
        'opentrons/opentrons_24_aluminumblock_nest_2ml_snapcap/1',
        'opentrons/opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap/1',
        'opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/1',
        'opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic/1',
        'opentrons/opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic/1',
        'opentrons/opentrons_24_tuberack_generic_2ml_screwcap/1',
        'opentrons/opentrons_24_tuberack_nest_0.5ml_screwcap/1',
        'opentrons/opentrons_24_tuberack_nest_1.5ml_screwcap/1',
        'opentrons/opentrons_24_tuberack_nest_1.5ml_snapcap/1',
        'opentrons/opentrons_24_tuberack_nest_2ml_screwcap/1',
        'opentrons/opentrons_24_tuberack_nest_2ml_snapcap/1',
        'opentrons/opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip/1',
        'opentrons/opentrons_6_tuberack_falcon_50ml_conical/1',
        'opentrons/opentrons_6_tuberack_nest_50ml_conical/1',
        'opentrons/opentrons_96_deep_well_temp_mod_adapter/1',
        'opentrons/opentrons_96_aluminumblock_biorad_wellplate_200ul/1',
        'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
        'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/2',
        'opentrons/opentrons_96_aluminumblock_nest_wellplate_100ul/1',
        'opentrons/opentrons_96_deep_well_adapter/1',
        'opentrons/opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep/1',
        'opentrons/opentrons_96_filtertiprack_1000ul/1',
        'opentrons/opentrons_96_filtertiprack_10ul/1',
        'opentrons/opentrons_96_filtertiprack_200ul/1',
        'opentrons/opentrons_96_filtertiprack_20ul/1',
        'opentrons/opentrons_96_flat_bottom_adapter/1',
        'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
        'opentrons/opentrons_96_pcr_adapter/1',
        'opentrons/opentrons_96_pcr_adapter_armadillo_wellplate_200ul/1',
        'opentrons/opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt/1',
        'opentrons/opentrons_96_tiprack_1000ul/1',
        'opentrons/opentrons_96_tiprack_10ul/1',
        'opentrons/opentrons_96_tiprack_20ul/1',
        'opentrons/opentrons_96_tiprack_300ul/1',
        'opentrons/opentrons_96_well_aluminum_block/1',
        'opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/1',
        'opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2',
        'opentrons/opentrons_aluminum_flat_bottom_plate/1',
        'opentrons/opentrons_calibration_adapter_heatershaker_module/1',
        'opentrons/opentrons_calibration_adapter_temperature_module/1',
        'opentrons/opentrons_calibration_adapter_thermocycler_module/1',
        'opentrons/opentrons_calibrationblock_short_side_left/1',
        'opentrons/opentrons_calibrationblock_short_side_right/1',
        'opentrons/opentrons_flex_96_filtertiprack_1000ul/1',
        'opentrons/opentrons_flex_96_filtertiprack_200ul/1',
        'opentrons/opentrons_flex_96_filtertiprack_50ul/1',
        'opentrons/opentrons_flex_96_tiprack_1000ul/1',
        'opentrons/opentrons_flex_96_tiprack_200ul/1',
        'opentrons/opentrons_flex_96_tiprack_50ul/1',
        'opentrons/opentrons_flex_96_tiprack_adapter/1',
        'opentrons/opentrons_flex_deck_riser/1',
        'opentrons/opentrons_flex_lid_absorbance_plate_reader_module/1',
        'opentrons/opentrons_tough_pcr_auto_sealing_lid/1',
        'opentrons/opentrons_universal_flat_adapter/1',
        'opentrons/opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat/1',
        'opentrons/thermoscientificnunc_96_wellplate_1300ul/1',
        'opentrons/thermoscientificnunc_96_wellplate_2000ul/1',
        'opentrons/tipone_96_tiprack_200ul/1',
        'opentrons/usascientific_12_reservoir_22ml/1',
        'opentrons/usascientific_96_wellplate_2.4ml_deep/1',
        'opentrons/evotips_flex_96_tiprack_adapter/1',
        'opentrons/evotips_opentrons_96_labware/1',
        'opentrons/opentrons_flex_tiprack_lid/1',
      ].toSorted()
    )
  })
  test('getAllLabwareDefs', () => {
    expect(Object.values(getAllLabwareDefsResult)).toStrictEqual(
      Object.values(getAllDefinitionsResult)
    )
  })
  test('getAllLegacyDefinitions', () => {
    expect(Object.keys(getAllLegacyDefinitionsResult).toSorted()).toStrictEqual(
      [
        '12-well-plate',
        '24-vial-rack',
        '24-well-plate',
        '384-plate',
        '48-vial-plate',
        '48-well-plate',
        '5ml-3x4',
        '6-well-plate',
        '96-PCR-flat',
        '96-PCR-tall',
        '96-deep-well',
        '96-flat',
        '96-well-plate-20mm',
        'MALDI-plate',
        'PCR-strip-tall',
        'T25-flask',
        'T75-flask',
        'alum-block-pcr-strips',
        'biorad-hardshell-96-PCR',
        'e-gelgol',
        'fixed-trash',
        'hampton-1ml-deep-block',
        'opentrons-aluminum-block-2ml-eppendorf',
        'opentrons-aluminum-block-2ml-screwcap',
        'opentrons-aluminum-block-96-PCR-plate',
        'opentrons-aluminum-block-PCR-strips-200ul',
        'opentrons-tiprack-10ul',
        'opentrons-tiprack-300ul',
        'opentrons-tuberack-1.5ml-eppendorf',
        'opentrons-tuberack-15_50ml',
        'opentrons-tuberack-15ml',
        'opentrons-tuberack-2ml-eppendorf',
        'opentrons-tuberack-2ml-screwcap',
        'opentrons-tuberack-50ml',
        'point',
        'rigaku-compact-crystallization-plate',
        'small_vial_rack_16x45',
        'tall-fixed-trash',
        'tiprack-1000ul-H',
        'tiprack-1000ul-chem',
        'tiprack-1000ul',
        'tiprack-10ul-H',
        'tiprack-10ul',
        'tiprack-200ul',
        'trash-box',
        'trough-12row-short',
        'trough-12row',
        'trough-1row-25ml',
        'tube-rack-.75ml',
        'tube-rack-15_50ml',
        'tube-rack-2ml-9x9',
        'tube-rack-2ml',
        'tube-rack-5ml-96',
        'tube-rack-80well',
        'wheaton_vial_rack',
      ].toSorted()
    )
  })
})

/**
 * Return the latest version of the given labware that's defined in schema 3.
 *
 * todo(mm, 2025-02-27): We already have a "production" getLatestLabwareDef() function
 * elsewhere, and it would be nice to reuse that, but it looks like that one currently
 * relies on a hard-coded list of labware.
 */
function findLatestDefinition(loadName: string): LabwareDefinition3 {
  const candidates: LabwareDefinition3[] = glob
    .sync('*.json', {
      cwd: path.join(definitionsDir, loadName),
      absolute: true,
    })
    .map(require)
  if (candidates.length === 0) {
    throw new Error(`No definitions found for ${loadName}.`)
  }
  candidates.sort((a, b) => a.version - b.version)
  const latest = candidates[candidates.length - 1]
  return latest
}

/**
 * Extract the given geometry from the given definition.
 *
 * If geometryKey is unspecified, the definition is expected to have exactly one
 * geometry key, and that one is extracted and returned.
 */
function getGeometry(
  loadName: string,
  geometryKey: string | undefined
): InnerWellGeometry {
  const definition = findLatestDefinition(loadName)
  const availableGeometries = definition.innerLabwareGeometry ?? {}

  if (geometryKey === undefined) {
    const availableGeometryEntries = Object.entries(availableGeometries)
    if (availableGeometryEntries.length !== 1) {
      throw new Error(
        `Expected exactly 1 geometry in ${definition.parameters.loadName} but found ${availableGeometryEntries.length}.`
      )
    }
    return availableGeometryEntries[0][1]
  } else {
    const result = availableGeometries[geometryKey]
    if (result === undefined) {
      throw new Error(
        `No geometry found in ${definition.parameters.loadName} with key ${geometryKey}.`
      )
    }
    return result
  }
}
