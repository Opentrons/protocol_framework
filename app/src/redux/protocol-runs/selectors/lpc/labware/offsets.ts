import { createSelector } from 'reselect'
import isEqual from 'lodash/isEqual'
import { getVectorDifference, getVectorSum } from '@opentrons/shared-data'

import {
  getSelectedLabwareWithOffsetDetails,
  getLocationSpecificOffsetDetailsForAllLabware,
  getMissingOffsets,
  getWorkingOffsetsByUri,
} from '../transforms'

import {
  getMostRecentVector,
  getMostRecentDefaultVector,
} from '/app/redux/protocol-runs/utils'

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
  LPCOffsetKind,
  WorkingOffset,
} from '/app/redux/protocol-runs'
import type { MissingOffsets, WorkingOffsetsByUri } from '../transforms'

// Get the location specific offset details for the currently user-selected labware geometry.
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

// Get the default offset details for the currently user-selected labware geometry.
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

// Get the working offsets for the currently user-selected labware geometry with offset details.
export const selectSelectedLwWithOffsetDetailsWorkingOffsets = (
  runId: string
): Selector<State, WorkingOffset | null> =>
  createSelector(
    (state: State) => getSelectedLabwareWithOffsetDetails(runId, state),
    details => details?.workingOffset ?? null
  )

// Returns the most recent vector offset for the selected labware with offset details, if any.
// For location-specific offsets, if no location-specific offset is found, returns
// the default offset, if any.
export const selectSelectedLwWithOffsetDetailsMostRecentVectorOffset = (
  runId: string
): Selector<State, VectorOffset | null> =>
  createSelector(
    (state: State) => getSelectedLabwareWithOffsetDetails(runId, state),
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo,
    (details, info) => {
      if (details == null) {
        console.error('Expected to find labware info details but did not.')
        return null
      } else {
        const kind = details?.locationDetails.kind ?? 'default'

        // First try to get the offset directly from the details
        const directVector = getMostRecentVector(
          details.workingOffset,
          details.existingOffset
        )

        if (directVector !== null) {
          return directVector
        } else {
          if (kind === 'default') {
            return null
          } else {
            // For location-specific offsets with no direct vector, fall back to
            // the default vector, if any.
            const selectedLwUri = details?.locationDetails.definitionUri ?? ''
            const defaultOffsetDetails =
              info?.labware[selectedLwUri]?.defaultOffsetDetails ?? null

            return getMostRecentDefaultVector(defaultOffsetDetails)
          }
        }
      }
    }
  )

export interface MostRecentVectorOffsetForUriAndLocation {
  kind: LPCOffsetKind
  offset: VectorOffset
}

export const selectMostRecentVectorOffsetForLwWithOffsetDetails = (
  runId: string,
  uri: string,
  offsetDetails: DefaultOffsetDetails | LocationSpecificOffsetDetails
): Selector<State, MostRecentVectorOffsetForUriAndLocation | null> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo.labware[uri],
    details => {
      if (details == null) {
        console.error('Expected to find labware info details but did not.')
        return null
      } else {
        if (offsetDetails.locationDetails.kind === 'default') {
          const defaultVector = getMostRecentDefaultVector(
            details.defaultOffsetDetails
          )

          return defaultVector != null
            ? { kind: 'default', offset: defaultVector }
            : null
        } else if (offsetDetails.locationDetails.kind === 'location-specific') {
          const lsOffsets = details.locationSpecificOffsetDetails ?? []
          const thisLSOffset = lsOffsets.find(offset =>
            isEqual(offset, offsetDetails)
          )

          // Handle the "reset to default" special case.
          if (
            thisLSOffset?.workingOffset?.confirmedVector === 'RESET_TO_DEFAULT'
          ) {
            const defaultVector = getMostRecentDefaultVector(
              details.defaultOffsetDetails
            )

            return defaultVector
              ? { kind: 'default', offset: defaultVector }
              : null
          }

          // Try to get location-specific vector
          const lsVector = thisLSOffset
            ? getMostRecentVector(
                thisLSOffset.workingOffset,
                thisLSOffset.existingOffset
              )
            : null

          if (lsVector != null) {
            return { kind: 'location-specific', offset: lsVector }
          }
          // Fall back to default if available
          else {
            const defaultVector = getMostRecentDefaultVector(
              details.defaultOffsetDetails
            )
            return defaultVector
              ? { kind: 'default', offset: defaultVector }
              : null
          }
        } else {
          return null
        }
      }
    }
  )

// NOTE: This count is analogous to the number of unique locations a labware geometry is utilized
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

// Whether the default offset is "absent" for the given labware geometry.
// The default offset only needs to be added client-side to be considered "not absent".
export const selectIsDefaultOffsetAbsent = (
  runId: string,
  uri: string
): Selector<State, boolean> =>
  createSelector(
    (state: State) =>
      state.protocolRuns[runId]?.lpc?.labwareInfo.labware[uri]
        .defaultOffsetDetails,
    details =>
      details?.existingOffset == null &&
      details?.workingOffset?.confirmedVector == null
  )

export const selectWorkingOffsetsByUri = (
  runId: string
): Selector<State, WorkingOffsetsByUri> =>
  createSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.labwareInfo.labware,
    labware => getWorkingOffsetsByUri(labware)
  )

// Returns the offset details for missing offsets, keyed by the labware URI.
// Note: only offsets persisted on the robot-server are "not missing."
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

// TODO(jh 03-07-25): Update alongside the new API integration work.
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
