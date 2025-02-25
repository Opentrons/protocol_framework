import {
  ALIGN_CENTER,
  COLORS,
  Check,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ListButton,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface CheckboxExpandStepFormFieldProps {
  title: string
  checkboxUpdateValue: (value: unknown) => void
  checkboxValue: unknown
  isChecked: boolean
  children?: ReactNode
  tooltipText?: string | null
  disabled?: boolean
}
export function CheckboxExpandStepFormField(
  props: CheckboxExpandStepFormFieldProps
): JSX.Element {
  const {
    checkboxUpdateValue,
    checkboxValue,
    children,
    isChecked,
    title,
    tooltipText,
    disabled = false,
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip()
  return (
    <>
      <ListButton
        type="noActive"
        padding={SPACING.spacing12}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            checkboxUpdateValue(!checkboxValue)
          }
        }}
        color={disabled ? COLORS.grey40 : COLORS.black90}
      >
        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <StyledText desktopStyle="bodyDefaultRegular" {...targetProps}>
              {title}
            </StyledText>
            <Check
              color={COLORS.blue50}
              isChecked={isChecked}
              disabled={disabled}
            />
          </Flex>
          {children}
        </Flex>
      </ListButton>
      {tooltipText != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
      ) : null}
    </>
  )
}
