import type { IconName, StyleProps } from '@opentrons/components'

export type ModalSize = 'small' | 'medium' | 'large'

export interface ModalHeaderBaseProps extends StyleProps {
  title: string | JSX.Element
  onClick?: React.MouseEventHandler
  hasExitIcon?: boolean
  iconName?: IconName
  iconColor?: string
}