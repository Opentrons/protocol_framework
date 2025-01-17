import type { UseLPCCommandsResult } from '/app/organisms/LabwarePositionCheck/hooks'
import type { LPCWizardFlexProps } from '/app/organisms/LabwarePositionCheck/LPCWizardFlex'

export type LPCWizardContentProps = Pick<
  LPCWizardFlexProps,
  'onCloseClick' | 'runId'
> & {
  proceed: () => void
  commandUtils: UseLPCCommandsResult
}
