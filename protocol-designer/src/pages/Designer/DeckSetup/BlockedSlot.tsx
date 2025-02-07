import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { RobotCoordsForeignDiv } from '@opentrons/components'
import { css } from 'styled-components'

type BlockedSlotMessage =
  | 'MODULE_INCOMPATIBLE_SINGLE_LABWARE'
  | 'MODULE_INCOMPATIBLE_LABWARE_SWAP'
  | 'LABWARE_INCOMPATIBLE_WITH_ADAPTER'

interface Props {
  x: number
  y: number
  width: number
  height: number
  message: BlockedSlotMessage
}

export const BlockedSlot = (props: Props): JSX.Element => {
  const { t } = useTranslation('deck')
  const { x, y, width, height, message } = props
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
            fontSize: '15px',
            color: 'white',
            margin: '-1.5rem 0.5rem',
          },
        }}
      >
        {t(`blocked_slot.${message}`)}
      </RobotCoordsForeignDiv>
    </g>
  )
}

// .blocked_slot_background {
//     fill: rgba(200, 115, 0, 0.75);
//     stroke: var(--c-red);
//     rx: 6;
//   }

//   .blocked_slot_content {
//     height: 100%;
//     margin: -1.5rem 0.5rem;
//     color: var(--c-white);
//     font-size: var(--fs-caption);
//     text-align: center;
//     line-height: 1.5;
//   }
