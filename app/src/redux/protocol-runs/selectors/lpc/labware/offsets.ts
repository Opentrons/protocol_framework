import { createSelector } from 'reselect'

import {
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'

import {
  getSelectedLabwareLocationSpecificOffsetDetails,
  getLocationSpecificOffsetDetailsForAllLabware,
  getMissingOffsets,
  getWorkingOffsetsByUri,
} from '../transforms'

import type { Selector } from 'reselect'
import type {
  LegacyLabwareOffsetLocation,
  VectorOffset,
} from '@opentrons/api-client'
import type { Coordinates } from '@opentrons/shared-data'
import type { State } from '/app/redux/types'
import type {
  DefaultOffsetDetails,
  LocationSpecificOffsetDetails,
} from '/app/redux/protocol-runs'
import type { MissingOffsets, WorkingOffsetsByUri } from '../transforms'

// Get the location specific details for the currently user-selected labware geometry.
export const selectSelectedLwLocationSpecificOffsetDetails = (
  runId: string
): Selector<State, LocationSpecificOffsetDetails[]> =>
  createSelector(
    (state: State) =>
      state.protocolRuns[runId]?.lpc?.labwareInfo.selectedLabware?.uri,
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo.labware,
    (uri, lw) => {
      if (uri == null || lw == null) {
        console.warn('Failed to access labware details.')
        return []
      } else {
        return lw[uri].locationSpecificOffsetDetails ?? []
      }
    }
  )

export const selectSelectedLwDefaultOffsetDetails = (
  runId: string
): Selector<State, DefaultOffsetDetails | null> =>
  createSelector(
    (state: State) =>
      state.protocolRuns[runId]?.lpc?.labwareInfo.selectedLabware?.uri,
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo.labware,
    (uri, lw) => {
      if (uri == null || lw == null) {
        console.warn('Failed to access labware details.')
        return null
      } else {
        return lw[uri].defaultOffsetDetails ?? null
      }
    }
  )

export const selectSelectedLwExistingLocationSpecificOffset = (
  runId: string
): Selector<State, VectorOffset> =>
  createSelector(
    (state: State) =>
      getSelectedLabwareLocationSpecificOffsetDetails(runId, state),
    details => {
      const existingVector = details?.existingOffset?.vector

      if (existingVector == null) {
        console.warn('No existing offset vector found for active labware')
        return IDENTITY_VECTOR
      } else {
        return existingVector ?? IDENTITY_VECTOR
      }
    }
  )

export const selectSelectedLwLocationSpecificOffsetInitialPosition = (
  runId: string
): Selector<State, VectorOffset | null> =>
  createSelector(
    (state: State) =>
      getSelectedLabwareLocationSpecificOffsetDetails(runId, state),
    details => {
      const workingOffset = details?.workingOffset

      if (workingOffset == null) {
        return null
      } else {
        return workingOffset.initialPosition
      }
    }
  )
// NOTE: This count is analogous to the number of locations a labware geometry is utilized
// in a run.
export const selectCountLocationSpecificOffsetsForLw = (
  runId: string,
  uri: string
): Selector<State, number> =>
  createSelector(
    (state: State) =>
      state.protocolRuns[runId]?.lpc?.labwareInfo.labware[uri]
        .locationSpecificOffsetDetails,
    locationSpecificDetails =>
      locationSpecificDetails != null ? locationSpecificDetails.length : 0
  )

// Whether the default offset is missing for the given labware geometry.
export const selectIsMissingDefaultOffsetForLw = (
  runId: string,
  uri: string
): Selector<State, boolean> =>
  createSelector(
    (state: State) =>
      state.protocolRuns[runId]?.lpc?.labwareInfo.labware[uri]
        .defaultOffsetDetails,
    details => details?.existingOffset == null
  )

export const selectWorkingOffsetsByUri = (
  runId: string
): Selector<State, WorkingOffsetsByUri> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo.labware,
    labware => getWorkingOffsetsByUri(labware)
  )

// Returns the offset details for missing offsets, keyed by the labware URI.
export const selectMissingOffsets = (
  runId: string
): Selector<State, MissingOffsets> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo.labware,
    labware => getMissingOffsets(labware)
  )

export interface SelectOffsetsToApplyResult {
  definitionUri: string
  location: LegacyLabwareOffsetLocation
  vector: Coordinates
}

export const selectOffsetsToApply = (
  runId: string
): Selector<State, SelectOffsetsToApplyResult[]> =>
  createSelector(
    (state: State) =>
      getLocationSpecificOffsetDetailsForAllLabware(runId, state),
    (state: State) => state.protocolRuns[runId]?.lpc?.protocolData,
    (allDetails, protocolData): SelectOffsetsToApplyResult[] => {
      if (protocolData == null) {
        console.warn('LPC state not initalized before selector use.')
        return []
      }

      return allDetails.flatMap(
        ({ workingOffset, existingOffset, locationDetails }) => {
          const definitionUri = locationDetails.definitionUri
          const { initialPosition, finalPosition } = workingOffset ?? {}

          if (
            finalPosition == null ||
            initialPosition == null ||
            definitionUri == null ||
            existingOffset == null ||
            // The slotName is null when applying a default offset. This condition
            // is effectively a stub to maintain compatability with the legacy HTTP API,
            // and will be refactored soon.
            locationDetails.slotName == null
          ) {
            console.error(
              `Cannot generate offsets for labware with incomplete details. ID: ${locationDetails.labwareId}`
            )
            return []
          }

          const existingOffsetVector = existingOffset.vector
          const finalVector = getVectorSum(
            existingOffsetVector,
            getVectorDifference(finalPosition, initialPosition)
          )
          return [
            {
              definitionUri,
              location: { ...locationDetails },
              vector: finalVector,
            },
          ]
        }
      )
    }
  )
