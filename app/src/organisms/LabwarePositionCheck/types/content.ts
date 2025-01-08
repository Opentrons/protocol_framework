import type { Dispatch } from 'react'
import type { LabwareOffset } from '@opentrons/api-client'
import type {
  LPCWizardAction,
  LPCWizardState,
} from '/app/organisms/LabwarePositionCheck/redux'
import type { UseLPCCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'

export type LPCWizardContentProps = Pick<LPCWizardFlexProps, 'onCloseClick'> & {
  proceed: () => void
  dispatch: Dispatch<LPCWizardAction>
  state: LPCWizardState
  // TOME TODO: Consider adding the commands state to the state state.
  commandUtils: UseLPCCommandsResult
  // TOME TODO: This should also be in state
  existingOffsets: LabwareOffset[]
}
