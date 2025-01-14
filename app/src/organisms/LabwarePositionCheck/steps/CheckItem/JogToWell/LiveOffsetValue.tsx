import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SIZE_1,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { StyleProps } from '@opentrons/components'
import type {
  CheckPositionsStep,
  LPCStepProps,
} from '/app/organisms/LabwarePositionCheck/types'

interface OffsetVectorProps extends StyleProps {
  x: number
  y: number
  z: number
}

export function LiveOffsetValue(
  props: OffsetVectorProps & LPCStepProps<CheckPositionsStep>
): JSX.Element {
  const { x, y, z, state, ...styleProps } = props
  const { i18n, t } = useTranslation('labware_position_check')

  return (
    <Flex css={FLEX_CONTAINER_STYLE}>
      <LegacyStyledText
        as="label"
        fontWeight={
          state.isOnDevice
            ? TYPOGRAPHY.fontWeightRegular
            : TYPOGRAPHY.fontWeightSemiBold
        }
      >
        {i18n.format(t('labware_offset_data'), 'capitalize')}
      </LegacyStyledText>
      <Flex css={OFFSET_CONTAINER_STYLE} {...styleProps}>
        <Icon name="reticle" size={state.isOnDevice ? '1.5rem' : SIZE_1} />
        {[x, y, z].map((axis, index) => (
          <Fragment key={index}>
            <LegacyStyledText css={OFFSET_LABEL_STYLE}>
              {['X', 'Y', 'Z'][index]}
            </LegacyStyledText>
            <LegacyStyledText as="p">{axis.toFixed(1)}</LegacyStyledText>
          </Fragment>
        ))}
      </Flex>
    </Flex>
  )
}

const FLEX_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  margin-top: ${SPACING.spacing8};
  margin-bottom: ${SPACING.spacing8};
  grid-gap: ${SPACING.spacing4};
`

const OFFSET_CONTAINER_STYLE = css`
  align-items: ${ALIGN_CENTER};
  border: ${BORDERS.styleSolid} 1px ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8};
`

const OFFSET_LABEL_STYLE = css`
  margin-left: ${SPACING.spacing8};
  margin-right: ${SPACING.spacing4};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`
