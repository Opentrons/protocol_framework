import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  ListItem,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { InputStepFormField } from '../../../../../../molecules'

import { type FieldPropsByName } from '../../types'

interface InputFieldProps{
  fieldTitle: string
  fieldKey: string
  units: string
  errorToShow?: string | null
}
interface MultiInputFieldProps {
  name: string
  tooltipContent: string
  propsForFields: FieldPropsByName
  fields: InputFieldProps[]
  extraButton?: string
}

export function MultiInputField(props: MultiInputFieldProps): JSX.Element {
  const { name, tooltipContent, extraButton, fields, propsForFields } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation(['protocol_steps', 'form', 'tooltip'])

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        padding={`0 ${SPACING.spacing16}`}
      >
        <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {t(`protocol_steps:${name}`)}
          </StyledText>
          <Flex {...targetProps}>
            <Icon
              name="information"
              size="1rem"
              color={COLORS.grey60}
              data-testid="information_icon"
            />
          </Flex>
          <Tooltip tooltipProps={tooltipProps}>{tooltipContent}</Tooltip>
        </Flex>
        <ListItem type="noActive">
          <Flex
            padding={SPACING.spacing12}
            width="100%"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
          >
            {fields.map(({ fieldTitle, fieldKey, units, errorToShow }) => (
                <InputStepFormField
                    key={fieldKey}
                    showTooltip={false}
                    padding="0"
                    title={t(fieldTitle)}
                    {...propsForFields[fieldKey]}
                    units={t(units)}
                    errorToShow={errorToShow}
                />
            ))}
            {(extraButton != null) && (
              {extraButton}
            )}
          </Flex>
        </ListItem>
      </Flex>
    </>
  )
}
