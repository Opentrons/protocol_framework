import type { Dispatch } from 'react'
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
  commandUtils: UseLPCCommandsResult
}
