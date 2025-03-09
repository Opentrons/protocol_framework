import { createSelector } from 'reselect'

import { getVectorDifference, getVectorSum } from '@opentrons/shared-data'

import {
  getSelectedLabwareWithOffsetDetails,
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
  LPCOffsetKind,
  WorkingOffset,
} from '/app/redux/protocol-runs'
import type { MissingOffsets, WorkingOffsetsByUri } from '../transforms'
import isEqual from 'lodash/isEqual'

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
      const kind = details?.locationDetails.kind ?? 'default'
      const workingVector = details?.workingOffset?.confirmedVector
      const existingVector = details?.existingOffset?.vector

      if (workingVector != null && workingVector !== 'RESET_TO_DEFAULT') {
        return workingVector
      } else if (
        existingVector != null &&
        workingVector !== 'RESET_TO_DEFAULT'
      ) {
        return existingVector
      } else {
        // If the selected offset is the default, return null. If it's location preferred,
        //  get the default offset if it exists.
        if (kind === 'default') {
          return null
        } else {
          const selectedLwUri = details?.locationDetails.definitionUri ?? ''
          const defaultDetails =
            info?.labware[selectedLwUri].defaultOffsetDetails
          const workingDefaultVector =
            defaultDetails?.workingOffset?.confirmedVector
          const existingDefaultVector = defaultDetails?.existingOffset?.vector

          if (workingDefaultVector != null) {
            return workingDefaultVector
          } else if (existingDefaultVector != null) {
            return existingDefaultVector
          } else {
            return null
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
      const defaultOffset = details?.defaultOffsetDetails
      const workingDefaultVector = defaultOffset?.workingOffset?.confirmedVector
      const existingDefaultVector = defaultOffset?.existingOffset?.vector
      const mostRecentDefaultOffset =
        workingDefaultVector ?? existingDefaultVector ?? null

      if (offsetDetails.locationDetails.kind === 'default') {
        if (mostRecentDefaultOffset == null) {
          return null
        } else {
          return { kind: 'default', offset: mostRecentDefaultOffset }
        }
      } else {
        const lsOffsets = details?.locationSpecificOffsetDetails ?? []
        const thisLSOffset = lsOffsets.find(offset =>
          isEqual(offset, offsetDetails)
        )
        const workingLSVector = thisLSOffset?.workingOffset?.confirmedVector

        if (workingLSVector === 'RESET_TO_DEFAULT') {
          if (mostRecentDefaultOffset == null) {
            return null
          } else {
            return { kind: 'default', offset: mostRecentDefaultOffset }
          }
        }

        const existingLSVector = thisLSOffset?.existingOffset?.vector
        const mostRecentLSVector = workingLSVector ?? existingLSVector

        if (mostRecentLSVector != null) {
          return { kind: 'location-specific', offset: mostRecentLSVector }
        } else if (mostRecentDefaultOffset != null) {
          return { kind: 'default', offset: mostRecentDefaultOffset }
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
// TOME TODO: This should share a transform with some other selectors.. This is basically the same as selectSelectedLwWithOffsetsMostRecentVectorOffset
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
