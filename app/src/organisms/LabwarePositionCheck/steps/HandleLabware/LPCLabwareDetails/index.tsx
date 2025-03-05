import { css } from 'styled-components'

import { Flex, SPACING } from '@opentrons/components'

import { AppliedLocationOffsetsContainer } from './AppliedLocationOffsetsContainer'
import { DefaultLocationOffset } from './DefaultLocationOffset'
import { LIST_CONTAINER_STYLE } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/contants'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCLabwareDetails(props: LPCWizardContentProps): JSX.Element {
  return (
    <Flex css={LIST_CONTAINER_STYLE}>
      <DefaultLocationOffset {...props} />
      <AppliedLocationOffsetsContainer {...props} />
      {/* Gives extra scrollable space. */}
      <Flex css={BOX_STYLE} />
    </Flex>
  )
}

const BOX_STYLE = css`
  height: ${SPACING.spacing40};
`
