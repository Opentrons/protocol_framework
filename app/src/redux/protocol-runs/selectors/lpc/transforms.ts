import isEqual from 'lodash/isEqual'

import { getLabwareDefURI } from '@opentrons/shared-data'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { State } from '/app/redux/types'
import type {
  LabwareDetails,
  LocationSpecificOffsetDetails,
  LPCLabwareInfo,
  LPCLabwareOffsetAppliedLocationDetails,
  LPCLabwareOffsetDefaultDetails,
  OffsetDetails,
} from '/app/redux/protocol-runs'

export interface GetLabwareDefsForLPCParams {
  labwareId: string
  loadedLabware: CompletedProtocolAnalysis['labware']
  labwareDefs: LabwareDefinition2[]
}

export const getItemLabwareDef = ({
  labwareId,
  loadedLabware,
  labwareDefs,
}: GetLabwareDefsForLPCParams): LabwareDefinition2 | null => {
  const labwareDefUri =
    loadedLabware.find(l => l.id === labwareId)?.definitionUri ?? null

  if (labwareDefUri == null) {
    console.warn(`Null labware def found for labwareId: ${labwareId}`)
  }

  return (
    labwareDefs.find(def => getLabwareDefURI(def) === labwareDefUri) ?? null
  )
}

export const getSelectedLabwareOffsetDetails = (
  runId: string,
  state: State
): OffsetDetails | null => {
  const selectedLabware =
    state.protocolRuns[runId]?.lpc?.labwareInfo.selectedLabware
  const offsetDetails =
    state.protocolRuns[runId]?.lpc?.labwareInfo.labware[
      selectedLabware?.uri ?? ''
    ].locationSpecificOffsetDetails

  return (
    offsetDetails?.find(offset =>
      isEqual(offset.locationDetails, selectedLabware?.offsetLocationDetails)
    ) ?? null
  )
}

export const getSelectedLabwareDefFrom = (
  runId: string,
  state: State
): LabwareDefinition2 | null => {
  const selectedLabware =
    state.protocolRuns[runId]?.lpc?.labwareInfo.selectedLabware
  const labwareDefs = state?.protocolRuns[runId]?.lpc?.labwareDefs
  const analysis = state?.protocolRuns[runId]?.lpc?.protocolData

  if (selectedLabware == null || labwareDefs == null || analysis == null) {
    console.warn('No selected labware or store not properly initialized.')
    return null
  } else {
    return getItemLabwareDef({
      labwareId: selectedLabware.id,
      labwareDefs,
      loadedLabware: analysis.labware,
    })
  }
}

export const getLocationSpecificOffsetDetailsForAllLabware = (
  runId: string,
  state: State
): LocationSpecificOffsetDetails[] => {
  const labware = state?.protocolRuns[runId]?.lpc?.labwareInfo.labware ?? {}

  return Object(labware).values(
    (details: LabwareDetails) => details.locationSpecificOffsetDetails
  )
}

type LabwareURI = string

export interface MisingDefaultOffsets {
  [uri: LabwareURI]: LPCLabwareOffsetDefaultDetails
}
export interface MissingLocationSpecificOffsets {
  [uri: LabwareURI]: LPCLabwareOffsetAppliedLocationDetails[]
}

export interface MissingOffsets {
  defaultOffsets: MisingDefaultOffsets
  locationSpecificOffsets: MissingLocationSpecificOffsets
}

// Derive missing offsets for every labware by checking to see if an "existing offset" value
// does not exist.
export const getMissingOffsets = (
  labware: LPCLabwareInfo['labware'] | undefined
): MissingOffsets => {
  const missingOffsets: MissingOffsets = {
    defaultOffsets: {},
    locationSpecificOffsets: {},
  }

  if (labware != null) {
    // Location specific missing offsets.
    Object.entries(labware).forEach(([uri, lwDetails]) => {
      lwDetails.locationSpecificOffsetDetails.forEach(detail => {
        const locationDetails = detail.locationDetails

        if (detail.existingOffset == null) {
          missingOffsets.locationSpecificOffsets[uri] =
            missingOffsets.locationSpecificOffsets[uri] != null
              ? [
                  ...missingOffsets.locationSpecificOffsets[uri],
                  locationDetails,
                ]
              : [locationDetails]
        }
      })

      // Default missing offsets.
      if (lwDetails.defaultOffsetDetails.existingOffset == null) {
        missingOffsets.defaultOffsets[uri] =
          lwDetails.defaultOffsetDetails.locationDetails
      }
    })
  }

  return missingOffsets
}
