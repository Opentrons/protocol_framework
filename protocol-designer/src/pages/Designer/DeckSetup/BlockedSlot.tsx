import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { COLORS, RobotCoordsForeignDiv } from '@opentrons/components'

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
          fill: rgba(200, 115, 0, 0.75);
          stroke: var(--c-red);
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
            fontSize: '12px',
            color: COLORS.white,
            margin: '-1.5rem 0.5rem',
            transform: 'rotate(180deg) scaleX(-1)',
          },
        }}
      >
        {t(`blocked_slot.${message}`)}
      </RobotCoordsForeignDiv>
    </g>
  )
}
