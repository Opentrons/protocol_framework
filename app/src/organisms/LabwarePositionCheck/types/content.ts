import type { UseLPCCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'
import type { LPCStep } from '/app/redux/protocol-runs'

export type LPCWizardContentProps = Pick<
  LPCWizardFlexProps,
  'onCloseClick' | 'runId'
> & {
  proceed: (toStep?: LPCStep) => void
  commandUtils: UseLPCCommandsResult
}
