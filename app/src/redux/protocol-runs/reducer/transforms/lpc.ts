import type {
  DefaultOffsetDetails,
  LabwareDetails,
  LocationSpecificOffsetDetails,
  LPCWizardAction,
  LPCWizardState,
} from '../../types'
import isEqual from 'lodash/isEqual'
import {
  SET_FINAL_POSITION,
  SET_INITIAL_POSITION,
} from '/app/redux/protocol-runs'

type PositionAction = Extract<
  LPCWizardAction,
  { type: 'SET_INITIAL_POSITION' | 'SET_FINAL_POSITION' }
>

// Handle vector position updates, only updating the appropriate working offset.
export function updateOffsetsForURI(
  state: LPCWizardState,
  action: PositionAction
): LabwareDetails {
  const { labwareUri, location } = action.payload
  const lwDetails = state.labwareInfo.labware[labwareUri]

  const updatedOffsets =
    location.kind === 'default'
      ? {
          defaultOffsetDetails: updateDefaultOffsetDetails(
            action,
            lwDetails.defaultOffsetDetails
          ),
        }
      : {
          locationSpecificOffsetDetails: updateLocationSpecificOffsetDetails(
            action,
            lwDetails.locationSpecificOffsetDetails
          ),
        }

  return { ...lwDetails, ...updatedOffsets }
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
    }

    return { ...defaultOffsetDetails, workingOffset: newWorkingDetail }
  } else {
    const newWorkingDetail =
      type === SET_INITIAL_POSITION
        ? {
            initialPosition: position,
            finalPosition: null,
          }
        : {
            ...defaultOffsetDetails.workingOffset,
            finalPosition: position,
          }

    return { ...defaultOffsetDetails, workingOffset: newWorkingDetail }
  }
}

// Only update the relevant location-specific offset from the list of all location-specific offsets.
function updateLocationSpecificOffsetDetails(
  action: PositionAction,
  locationSpecificOffsetDetails: LocationSpecificOffsetDetails[]
): LocationSpecificOffsetDetails[] {
  const { type, payload } = action
  const { labwareUri, position, location } = payload

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

    if (relevantDetail.workingOffset == null) {
      const newWorkingDetail = {
        initialPosition: type === SET_INITIAL_POSITION ? position : null,
        finalPosition: type === SET_FINAL_POSITION ? position : null,
      }

      return [
        ...newOffsetDetails,
        { ...relevantDetail, workingOffset: newWorkingDetail },
      ]
    } else {
      const newWorkingDetail =
        type === SET_INITIAL_POSITION
          ? {
              initialPosition: position,
              finalPosition: null,
            }
          : {
              ...relevantDetail.workingOffset,
              finalPosition: position,
            }

      return [
        ...newOffsetDetails,
        { ...relevantDetail, workingOffset: newWorkingDetail },
      ]
    }
  }
}
