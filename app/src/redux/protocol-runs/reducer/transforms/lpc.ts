import isEqual from 'lodash/isEqual'

import type { LPCWizardAction, WorkingOffset } from '../../types'

export function updateWorkingOffset(
  workingOffsets: WorkingOffset[],
  action: Extract<
    LPCWizardAction,
    { type: 'SET_INITIAL_POSITION' | 'SET_FINAL_POSITION' }
  >
): WorkingOffset[] {
  const { type, payload } = action
  const { labwareId, location, position } = payload
  const existingRecordIndex = workingOffsets.findIndex(
    record =>
      record.labwareId === labwareId && isEqual(record.location, location)
  )

  if (existingRecordIndex < 0) {
    return [
      ...workingOffsets,
      {
        labwareId,
        location,
        initialPosition: type === 'SET_INITIAL_POSITION' ? position : null,
        finalPosition: type === 'SET_FINAL_POSITION' ? position : null,
      },
    ]
  } else {
    const updatedOffset = {
      ...workingOffsets[existingRecordIndex],
      ...(type === 'SET_INITIAL_POSITION' && {
        initialPosition: position,
        finalPosition: null,
      }),
      ...(type === 'SET_FINAL_POSITION' && {
        finalPosition: position,
      }),
    }

    return [
      ...workingOffsets.slice(0, existingRecordIndex),
      updatedOffset,
      ...workingOffsets.slice(existingRecordIndex + 1),
    ]
  }
}
