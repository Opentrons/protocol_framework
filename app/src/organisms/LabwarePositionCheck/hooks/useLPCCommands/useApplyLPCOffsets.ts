import { useState } from 'react'

import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'

import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type { UseLPCCommandChildProps } from './types'

export interface UseApplyLPCOffsetsProps extends UseLPCCommandChildProps {
  setErrorMessage: (msg: string | null) => void
}

export interface UseApplyLPCOffsetsResult {
  handleApplyOffsets: (offsets: LabwareOffsetCreateData[]) => void
  isApplyingOffsets: boolean
}

export function useApplyLPCOffsets({
  onCloseClick,
  runId,
  setErrorMessage,
}: UseApplyLPCOffsetsProps): UseApplyLPCOffsetsResult {
  const [isApplyingOffsets, setIsApplyingOffsets] = useState<boolean>(false)

  const { createLabwareOffset } = useCreateLabwareOffsetMutation()

  const handleApplyOffsets = (offsets: LabwareOffsetCreateData[]): void => {
    setIsApplyingOffsets(true)
    Promise.all(offsets.map(data => createLabwareOffset({ runId, data })))
      .then(() => {
        onCloseClick()
        setIsApplyingOffsets(false)
      })
      .catch((e: Error) => {
        setErrorMessage(`Error applying labware offsets: ${e.message}`)
      })
  }

  return { isApplyingOffsets, handleApplyOffsets }
}
