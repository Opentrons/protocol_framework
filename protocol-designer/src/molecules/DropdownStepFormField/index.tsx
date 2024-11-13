import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import {
  COLORS,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'
import type { Options } from '@opentrons/components'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

export interface DropdownStepFormFieldProps extends FieldProps {
  options: Options
  title: string
  width?: string
}

export function DropdownStepFormField(
  props: DropdownStepFormFieldProps
): JSX.Element {
  const {
    options,
    value,
    updateValue,
    title,
    errorToShow,
    tooltipContent,
    padding = `0 ${SPACING.spacing16}`,
    width = '17.5rem',
    onFieldFocus,
    onFieldBlur,
  } = props
  const { t } = useTranslation('tooltip')
  const availableOptionId = options.find(opt => opt.value === value)

  useEffect(() => {
    if (options.length === 1) {
      updateValue(options[0].value)
    }
  }, [])

  return (
    <Flex padding={padding ?? SPACING.spacing16}>
      {options.length > 1 || options.length === 0 ? (
        <DropdownMenu
          tooltipText={tooltipContent != null ? t(`${tooltipContent}`) : null}
          width={width}
          error={errorToShow}
          dropdownType="neutral"
          filterOptions={options}
          title={title}
          onBlur={onFieldBlur}
          onFocus={onFieldFocus}
          currentOption={
            availableOptionId ?? { name: 'Choose option', value: '' }
          }
          onClick={value => {
            updateValue(value)
          }}
        />
      ) : (
        <Flex
          gridGap={SPACING.spacing8}
          flexDirection={DIRECTION_COLUMN}
          width="100%"
        >
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {title}
          </StyledText>
          <ListItem type="noActive">
            <Flex padding={SPACING.spacing12}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {options[0].name}
              </StyledText>
            </Flex>
          </ListItem>
        </Flex>
      )}
    </Flex>
  )
}
