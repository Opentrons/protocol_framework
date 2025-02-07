import { css } from 'styled-components'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { StepMeter } from '/app/atoms/StepMeter'
// TODO(jh, 02-05-25): Move ChildNavigation to molecules.
// eslint-disable-next-line opentrons/no-imports-across-applications
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useSelector } from 'react-redux'
import { selectStepInfo } from '/app/redux/protocol-runs'

// eslint-disable-next-line opentrons/no-imports-across-applications
import type { ChildNavigationProps } from '/app/organisms/ODD/ChildNavigation'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

type LPCContentContainerProps = LPCWizardContentProps &
  Partial<ChildNavigationProps> & {
    children: JSX.Element
    header: string
  }

export function LPCContentContainer({
  children,
  runId,
  ...rest
}: LPCContentContainerProps): JSX.Element {
  const { currentStepIndex, totalStepCount } = useSelector(
    selectStepInfo(runId)
  )

  return (
    <>
      <StepMeter totalSteps={totalStepCount} currentStep={currentStepIndex} />
      <ChildNavigation {...rest} css={CHILD_NAV_STYLE} />
      <Flex css={CHILDREN_CONTAINER_STYLE}>{children}</Flex>
    </>
  )
}

// TODO(jh, 02-05-25): Investigate whether we can remove the position: fixed styling from ChildNav.
const CHILD_NAV_STYLE = css`
  top: ${SPACING.spacing8};
`
const CHILDREN_CONTAINER_STYLE = css`
  margin-top: 7.75rem;
  flex-direction: ${DIRECTION_COLUMN};
`
