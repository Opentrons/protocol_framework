import { isEqual } from 'lodash'

import { getLabwareDefURI, getPipetteNameSpecs } from '@opentrons/shared-data'

import { NAV_STEPS } from '../../../../constants'
import { getLabwareLocationCombos } from '/app/organisms/LegacyApplyHistoricOffsets/hooks/getLabwareLocationCombos'

import type { LoadedPipette } from '@opentrons/shared-data'
import type {
  LabwarePositionCheckStep,
  CheckPositionsStep,
} from '/app/organisms/LabwarePositionCheck/types'
import type { LabwareLocationCombo } from '/app/organisms/LegacyApplyHistoricOffsets/hooks/getLabwareLocationCombos'
import type { GetLPCStepsParams } from '.'

export function getProbeBasedLPCSteps(
  params: GetLPCStepsParams
): LabwarePositionCheckStep[] {
  const { protocolData } = params

  return [
    { section: NAV_STEPS.BEFORE_BEGINNING },
    {
      section: NAV_STEPS.ATTACH_PROBE,
      pipetteId: getPrimaryPipetteId(protocolData.pipettes),
    },
    ...getAllCheckSectionSteps(params),
    {
      section: NAV_STEPS.DETACH_PROBE,
      pipetteId: getPrimaryPipetteId(protocolData.pipettes),
    },
    { section: NAV_STEPS.RESULTS_SUMMARY },
  ]
}

function getPrimaryPipetteId(pipettes: LoadedPipette[]): string {
  if (pipettes.length < 1) {
    throw new Error(
      'no pipettes in protocol, cannot determine primary pipette for LPC'
    )
  }

  return pipettes.reduce((acc, pip) => {
    return (getPipetteNameSpecs(acc.pipetteName)?.channels ?? 0) >
      (getPipetteNameSpecs(pip.pipetteName)?.channels ?? 0)
      ? pip
      : acc
  }, pipettes[0]).id
}

function getAllCheckSectionSteps({
  labwareDefs,
  protocolData,
}: GetLPCStepsParams): CheckPositionsStep[] {
  const { pipettes, commands, labware, modules = [] } = protocolData
  const labwareLocationCombos = getLabwareLocationCombos(
    commands,
    labware,
    modules
  )
  const labwareLocations = labwareLocationCombos.reduce<LabwareLocationCombo[]>(
    (acc, labwareLocationCombo) => {
      const labwareDef = labwareDefs.find(
        def => getLabwareDefURI(def) === labwareLocationCombo.definitionUri
      )
      if (
        (labwareDef?.allowedRoles ?? []).includes('adapter') ||
        (labwareDef?.allowedRoles ?? []).includes('lid')
      ) {
        return acc
      }
      // remove duplicate definitionUri in same location
      const comboAlreadyExists = acc.some(
        accLocationCombo =>
          labwareLocationCombo.definitionUri ===
            accLocationCombo.definitionUri &&
          isEqual(labwareLocationCombo.location, accLocationCombo.location)
      )
      return comboAlreadyExists ? acc : [...acc, labwareLocationCombo]
    },
    []
  )

  return labwareLocations.map(
    ({ location, labwareId, moduleId, adapterId, definitionUri }) => ({
      section: NAV_STEPS.CHECK_POSITIONS,
      labwareId: labwareId,
      pipetteId: getPrimaryPipetteId(pipettes),
      location,
      moduleId,
      adapterId,
      definitionUri,
    })
  )
}
