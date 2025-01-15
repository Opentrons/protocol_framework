import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type { UseLPCCommandChildProps } from '/app/organisms/LabwarePositionCheck/hooks/useLPCCommands/types'
import { selectOffsetsToApply } from '/app/organisms/LabwarePositionCheck/redux'

export interface UseBuildOffsetsToApplyResult {
  buildOffsetsToApply: () => LabwareOffsetCreateData[]
}

export interface UseApplyLPCOffsetsProps extends UseLPCCommandChildProps {
  setErrorMessage: (msg: string | null) => void
}

export function useBuildOffsetsToApply({
  state,
  setErrorMessage,
}: UseApplyLPCOffsetsProps): UseBuildOffsetsToApplyResult {
  return {
    buildOffsetsToApply: () => {
      try {
        return selectOffsetsToApply(state)
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message)
        } else {
          setErrorMessage('Failed to create finalized labware offsets.')
        }
        return []
      }
    },
  }
}
