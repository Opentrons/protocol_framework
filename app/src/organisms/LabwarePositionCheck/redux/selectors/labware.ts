import { createSelector } from 'reselect'
import isEqual from 'lodash/isEqual'

import {
  getIsTiprack,
  getLabwareDisplayName,
  getLabwareDefURI,
  getVectorSum,
  getVectorDifference,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'

import { getItemLabwareDef } from '/app/organisms/LabwarePositionCheck/steps/CheckItem/utils'

import type { VectorOffset } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux/types'
import { getCurrentOffsetForLabwareInLocation } from '/app/transformations/analysis'

// TODO(jh, 01-13-25): Remove the explicit type casting after restructuring "step".

export const selectActiveLwInitialPosition = (
  state: LPCWizardState
): VectorOffset | null => {
  const labwareId =
    'labwareId' in state.steps.current ? state.steps.current.labwareId : ''

  return (
    state.workingOffsets.find(
      o =>
        o.labwareId === labwareId &&
        isEqual(o.location, location) &&
        o.initialPosition != null
    )?.initialPosition ?? null
  )
}

export const selectActiveLwExistingOffset = (
  state: LPCWizardState
): VectorOffset => {
  const { existingOffsets, steps } = state

  if (
    !('labwareId' in steps.current) ||
    !('location' in steps.current) ||
    !('slotName' in steps.current.location)
  ) {
    console.warn(
      `No labwareId or location in current step: ${steps.current.section}`
    )
    return IDENTITY_VECTOR
  } else {
    const lwUri = getLabwareDefURI(
      selectItemLabwareDef(state) as LabwareDefinition2
    )

    return (
      // @ts-expect-error Typechecking for slotName done above.
      getCurrentOffsetForLabwareInLocation(existingOffsets, lwUri, location)
        ?.vector ?? IDENTITY_VECTOR
    )
  }
}

export const selectOffsetsToApply = createSelector(
  (state: LPCWizardState) => state.workingOffsets,
  (state: LPCWizardState) => state.protocolData,
  (state: LPCWizardState) => state.existingOffsets,
  (workingOffsets, protocolData, existingOffsets) => {
    return workingOffsets.map(
      ({ initialPosition, finalPosition, labwareId, location }) => {
        const definitionUri =
          protocolData.labware.find(l => l.id === labwareId)?.definitionUri ??
          null

        if (
          finalPosition == null ||
          initialPosition == null ||
          definitionUri == null
        ) {
          throw new Error(
            `cannot create offset for labware with id ${labwareId}, in location ${JSON.stringify(
              location
            )}, with initial position ${String(
              initialPosition
            )}, and final position ${String(finalPosition)}`
          )
        } else {
          const existingOffset =
            getCurrentOffsetForLabwareInLocation(
              existingOffsets,
              definitionUri,
              location
            )?.vector ?? IDENTITY_VECTOR
          const vector = getVectorSum(
            existingOffset,
            getVectorDifference(finalPosition, initialPosition)
          )
          return { definitionUri, location, vector }
        }
      }
    )
  }
)

export const selectIsActiveLwTipRack = (state: LPCWizardState): boolean => {
  if ('labwareId' in state.steps.current) {
    return getIsTiprack(selectItemLabwareDef(state) as LabwareDefinition2)
  } else {
    console.warn('No labwareId in step.')
    return false
  }
}

export const selectLwDisplayName = (state: LPCWizardState): string => {
  if ('labwareId' in state.steps.current) {
    return getLabwareDisplayName(
      selectItemLabwareDef(state) as LabwareDefinition2
    )
  } else {
    console.warn('No labwareId in step.')
    return ''
  }
}

export const selectActiveAdapterDisplayName = (
  state: LPCWizardState
): string => {
  const { protocolData, labwareDefs, steps } = state

  return 'adapterId' in steps.current && steps.current.adapterId != null
    ? getItemLabwareDef({
        labwareId: steps.current.adapterId,
        loadedLabware: protocolData.labware,
        labwareDefs,
      })?.metadata.displayName ?? ''
    : ''
}

// TOME TODO: getItemLabwareDef should be moved to a general utils place I think.
export const selectItemLabwareDef = createSelector(
  (state: LPCWizardState) => state.steps.current,
  (state: LPCWizardState) => state.labwareDefs,
  (state: LPCWizardState) => state.protocolData.labware,
  (current, labwareDefs, loadedLabware) => {
    const labwareId = 'labwareId' in current ? current.labwareId : ''

    if (labwareId === '') {
      console.warn(`No labwareId associated with step: ${current.section}`)
      return null
    }

    return getItemLabwareDef({
      labwareId,
      labwareDefs,
      loadedLabware,
    })
  }
)
