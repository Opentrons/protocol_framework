import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  RobotCoordsForeignDiv,
  SPACING,
  StyledText,
} from '@opentrons/components'

type BlockedSlotMessage =
  | 'MODULE_INCOMPATIBLE_SINGLE_LABWARE'
  | 'MODULE_INCOMPATIBLE_LABWARE_SWAP'
  | 'LABWARE_INCOMPATIBLE_WITH_ADAPTER'

interface BlockedSlotProps {
  x: number
  y: number
  width: number
  height: number
  message: BlockedSlotMessage
}

export const BlockedSlot = (props: BlockedSlotProps): JSX.Element => {
  const { t } = useTranslation('deck')
  const { x, y, width, height, message } = props
  //    TODO: get design feedback on this
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        css={css`
          fill: ${COLORS.red20};
          stroke: ${COLORS.red60};
          rx: 6;
        `}
      />
      <RobotCoordsForeignDiv
        x={x}
        y={y}
        width={width}
        height={height}
        innerDivProps={{
          style: {
            height: '100%',
            margin: `${
              message === 'MODULE_INCOMPATIBLE_LABWARE_SWAP'
                ? '0'
                : `-${SPACING.spacing8}rem`
            } ${SPACING.spacing8}rem`,
            transform: 'rotate(180deg) scaleX(-1)',
          },
        }}
      >
        <Flex gridGap={SPACING.spacing12} alignItems={ALIGN_CENTER}>
          <Icon name="ot-alert" size="2rem" color={COLORS.red60} />
          <StyledText desktopStyle="captionRegular" color={COLORS.red60}>
            {t(`blocked_slot.${message}`)}
          </StyledText>
        </Flex>
      </RobotCoordsForeignDiv>
    </g>
  )
}
