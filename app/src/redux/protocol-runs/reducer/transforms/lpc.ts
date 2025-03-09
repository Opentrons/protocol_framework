import type {
  ApplyWorkingOffsetsAction,
  ClearSelectedLabwareWorkingOffsetsAction,
  DefaultOffsetDetails,
  FinalPositionAction,
  InitialPositionAction,
  LwGeometryDetails,
  LocationSpecificOffsetDetails,
  LPCWizardState,
  ResetLocationSpecificOffsetToDefaultAction,
} from '../../types'
import isEqual from 'lodash/isEqual'
import {
  SET_FINAL_POSITION,
  SET_INITIAL_POSITION,
} from '/app/redux/protocol-runs'
import {
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'

type PositionAction = InitialPositionAction | FinalPositionAction
type ResetPositionAction = ResetLocationSpecificOffsetToDefaultAction

type UpdateOffsetsAction =
  | PositionAction
  | ResetPositionAction
  | ClearSelectedLabwareWorkingOffsetsAction
  | ApplyWorkingOffsetsAction

// TOME TODO: Simplify this.

// Handle vector position updates, only updating the appropriate working offset.
export function updateOffsetsForURI(
  state: LPCWizardState,
  action: UpdateOffsetsAction
): LwGeometryDetails {
  if (action.type === 'APPLY_WORKING_OFFSETS') {
    const lwDetails = state.labwareInfo.labware[action.payload.labwareUri]
    const updatedLSOffsetDetails = lwDetails.locationSpecificOffsetDetails.map(
      offset => {
        if (offset.workingOffset?.confirmedVector != null) {
          if (offset.workingOffset.confirmedVector === 'RESET_TO_DEFAULT') {
            return { ...offset, workingOffset: null, existingOffset: null }
          } else {
            return {
              ...offset,
              workingOffset: null,
              existingOffset: {
                vector: offset.workingOffset.confirmedVector,
                // TODO(jh, 03-07-25): This is technically wrong, but functionally
                //  not an issue given how we use/don't use this timestamp currently. Still,
                //  let's update createdAt to use the server response.
                createdAt: new Date().getTime().toString(),
              },
            }
          }
        } else {
          return offset
        }
      }
    )
    const updatedDefaultOffsetDetails: DefaultOffsetDetails =
      lwDetails.defaultOffsetDetails.workingOffset?.confirmedVector != null
        ? {
            ...lwDetails.defaultOffsetDetails,
            workingOffset: null,
            existingOffset: {
              vector:
                lwDetails.defaultOffsetDetails.workingOffset.confirmedVector,
              createdAt: new Date().getTime().toString(),
            },
          }
        : { ...lwDetails.defaultOffsetDetails }

    return {
      ...lwDetails,
      defaultOffsetDetails: updatedDefaultOffsetDetails,
      locationSpecificOffsetDetails: updatedLSOffsetDetails,
    }
  } else if (action.type === 'CLEAR_WORKING_OFFSETS') {
    const lwDetails = state.labwareInfo.labware[action.payload.labwareUri]

    const updatedLSOffsetDetails = lwDetails.locationSpecificOffsetDetails.map(
      offset => ({ ...offset, workingOffset: null })
    )

    return {
      ...lwDetails,
      locationSpecificOffsetDetails: updatedLSOffsetDetails,
      defaultOffsetDetails: {
        ...lwDetails.defaultOffsetDetails,
        workingOffset: null,
      },
    }
  } else {
    const { labwareUri, location } = action.payload
    const lwDetails = state.labwareInfo.labware[labwareUri]

    const updatedOffsets =
      location.kind === 'default' && action.type !== 'RESET_OFFSET_TO_DEFAULT'
        ? {
            defaultOffsetDetails: updateDefaultOffsetDetails(
              action,
              lwDetails.defaultOffsetDetails
            ),
          }
        : {
            locationSpecificOffsetDetails: updateLocationSpecificOffsetDetails(
              action,
              lwDetails
            ),
          }

    return { ...lwDetails, ...updatedOffsets }
  }
}

// Update the default offset.
function updateDefaultOffsetDetails(
  action: PositionAction,
  defaultOffsetDetails: DefaultOffsetDetails
): DefaultOffsetDetails {
  const { type, payload } = action
  const { position } = payload

  if (defaultOffsetDetails.workingOffset == null) {
    const newWorkingDetail = {
      initialPosition: type === SET_INITIAL_POSITION ? position : null,
      finalPosition: type === SET_FINAL_POSITION ? position : null,
      confirmedVector: null,
    }

    return { ...defaultOffsetDetails, workingOffset: newWorkingDetail }
  } else {
    const newWorkingDetail =
      type === SET_INITIAL_POSITION
        ? {
            ...defaultOffsetDetails.workingOffset,
            initialPosition: position,
            finalPosition: null,
          }
        : {
            ...defaultOffsetDetails.workingOffset,
            finalPosition: position,
            confirmedVector: getVectorSum(
              defaultOffsetDetails.existingOffset?.vector ??
                defaultOffsetDetails?.workingOffset?.confirmedVector ??
                IDENTITY_VECTOR,
              getVectorDifference(
                position ?? IDENTITY_VECTOR,
                defaultOffsetDetails.workingOffset.initialPosition ??
                  IDENTITY_VECTOR
              )
            ),
          }

    return { ...defaultOffsetDetails, workingOffset: newWorkingDetail }
  }
}

// Only update the relevant location-specific offset from the list of all location-specific offsets.
function updateLocationSpecificOffsetDetails(
  action: PositionAction | ResetPositionAction,
  lwDetails: LwGeometryDetails
): LocationSpecificOffsetDetails[] {
  const { type, payload } = action

  if (type === 'RESET_OFFSET_TO_DEFAULT') {
    const { labwareUri, location } = payload

    const locationSpecificOffsetDetails =
      lwDetails.locationSpecificOffsetDetails
    const relevantDetailsIdx = locationSpecificOffsetDetails.findIndex(detail =>
      isEqual(location, detail.locationDetails)
    )

    if (relevantDetailsIdx < 0) {
      console.warn(`No matching location found for ${labwareUri}`)
      return locationSpecificOffsetDetails
    } else {
      const relevantDetail = locationSpecificOffsetDetails[relevantDetailsIdx]
      const newOffsetDetails = [
        ...locationSpecificOffsetDetails.slice(0, relevantDetailsIdx),
        ...locationSpecificOffsetDetails.slice(relevantDetailsIdx + 1),
      ]

      // TOME TODO: Explain this in a comment, but if the exisiting offset is null,
      //  we can just set the working back to null and avoid sending to the server
      //  the DELETE network request, which is based on the presence of working offsets.

      const newRelevantDetail: LocationSpecificOffsetDetails = {
        ...relevantDetail,
        workingOffset:
          relevantDetail.existingOffset != null
            ? {
                initialPosition:
                  relevantDetail.workingOffset?.initialPosition ?? null,
                finalPosition:
                  relevantDetail.workingOffset?.finalPosition ?? null,
                confirmedVector: 'RESET_TO_DEFAULT',
              }
            : null,
      }

      return [...newOffsetDetails, newRelevantDetail]
    }
  } else {
    const { labwareUri, position, location } = payload
    const locationSpecificOffsetDetails =
      lwDetails.locationSpecificOffsetDetails

    const relevantDetailsIdx = locationSpecificOffsetDetails.findIndex(detail =>
      isEqual(location, detail.locationDetails)
    )

    if (relevantDetailsIdx < 0) {
      console.warn(`No matching location found for ${labwareUri}`)
      return locationSpecificOffsetDetails
    } else {
      const relevantDetail = locationSpecificOffsetDetails[relevantDetailsIdx]
      const newOffsetDetails = [
        ...locationSpecificOffsetDetails.slice(0, relevantDetailsIdx),
        ...locationSpecificOffsetDetails.slice(relevantDetailsIdx + 1),
      ]

      if (
        relevantDetail.workingOffset?.confirmedVector === 'RESET_TO_DEFAULT'
      ) {
        console.error(
          'Unexpected reset to default supplied when vector value expected.'
        )
        return locationSpecificOffsetDetails
      } else if (relevantDetail.workingOffset == null) {
        const newWorkingDetail = {
          initialPosition: type === SET_INITIAL_POSITION ? position : null,
          finalPosition: type === SET_FINAL_POSITION ? position : null,
          confirmedVector: null,
        }

        return [
          ...newOffsetDetails,
          { ...relevantDetail, workingOffset: newWorkingDetail },
        ]
      } else {
        const newWorkingDetail =
          type === SET_INITIAL_POSITION
            ? {
                ...relevantDetail.workingOffset,
                initialPosition: position,
                finalPosition: null,
              }
            : {
                ...relevantDetail.workingOffset,
                finalPosition: position,
                confirmedVector: getVectorSum(
                  relevantDetail.existingOffset?.vector ??
                    relevantDetail.workingOffset.confirmedVector ??
                    lwDetails.defaultOffsetDetails.workingOffset
                      ?.confirmedVector ??
                    lwDetails.defaultOffsetDetails.existingOffset?.vector ??
                    IDENTITY_VECTOR,
                  getVectorDifference(
                    position ?? IDENTITY_VECTOR,
                    relevantDetail.workingOffset.initialPosition ??
                      IDENTITY_VECTOR
                  )
                ),
              }

        // TOME TODO: Leave a comment here. If the new vector is the exact same as the default vector
        // reset it to the default vector instead of updating the server with the same thing.
        const currentDefaultVector =
          lwDetails.defaultOffsetDetails.workingOffset?.confirmedVector ??
          lwDetails.defaultOffsetDetails.existingOffset?.vector ??
          null

        if (isEqual(newWorkingDetail.confirmedVector, currentDefaultVector)) {
          if (relevantDetail.existingOffset != null) {
            return [
              ...newOffsetDetails,
              {
                ...relevantDetail,
                workingOffset: {
                  ...newWorkingDetail,
                  confirmedVector: 'RESET_TO_DEFAULT',
                },
              },
            ]
          } else {
            return [
              ...newOffsetDetails,
              { ...relevantDetail, workingOffset: null },
            ]
          }
        } else {
          return [
            ...newOffsetDetails,
            { ...relevantDetail, workingOffset: newWorkingDetail },
          ]
        }
      }
    }
  }
}
