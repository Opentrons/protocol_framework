import { useSelector } from 'react-redux'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { AppliedLocationOffsetsContainer } from './AppliedLocationOffsetsContainer'
import { DefaultLocationOffset } from './DefaultLocationOffset'
import {
  selectIsMissingDefaultOffsetForLw,
  selectSelectedLabwareInfo,
} from '/app/redux/protocol-runs'
import { InlineNotification } from '/app/atoms/InlineNotification'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCLabwareDetails(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')

  const selectedLwInfo = useSelector(selectSelectedLabwareInfo(props.runId))
  const isMissingDefaultOffset = useSelector(
    selectIsMissingDefaultOffsetForLw(props.runId, selectedLwInfo?.uri ?? '')
  )

  // TODO(jh, 03-06-25): Add the "hardcoded" inline notification once hardcoded offsets
  //  are supported.
  return (
    <Flex css={LIST_CONTAINER_STYLE}>
      {isMissingDefaultOffset && (
        <InlineNotification
          type="alert"
          heading={t('add_a_default_offset')}
          message={t('specific_slots_can_be_adjusted')}
        />
      )}
      <DefaultLocationOffset {...props} />
      <AppliedLocationOffsetsContainer {...props} />
      {/* Gives extra scrollable space. */}
      <Flex css={BOX_STYLE} />
    </Flex>
  )
}

export const LIST_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing24};
`

const BOX_STYLE = css`
  height: ${SPACING.spacing40};
`
