import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

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
    <Flex
      flexDirection={DIRECTION_COLUMN}
      marginY={SPACING.spacing8}
      gridGap={SPACING.spacing4}
    >
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
      <Flex
        alignItems={ALIGN_CENTER}
        border={`${BORDERS.styleSolid} 1px ${COLORS.grey30}`}
        borderRadius={BORDERS.borderRadius4}
        padding={SPACING.spacing8}
        {...styleProps}
      >
        <Icon name="reticle" size={state.isOnDevice ? '1.5rem' : SIZE_1} />
        {[x, y, z].map((axis, index) => (
          <Fragment key={index}>
            <LegacyStyledText
              as="p"
              marginLeft={SPACING.spacing8}
              marginRight={SPACING.spacing4}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {['X', 'Y', 'Z'][index]}
            </LegacyStyledText>
            <LegacyStyledText as="p">{axis.toFixed(1)}</LegacyStyledText>
          </Fragment>
        ))}
      </Flex>
    </Flex>
  )
}
