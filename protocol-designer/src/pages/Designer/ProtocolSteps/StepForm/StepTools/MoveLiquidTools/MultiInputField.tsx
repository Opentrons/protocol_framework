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
import { PositionField } from '../../PipetteFields'
import type { FieldPropsByName } from '../../types'

export interface StepInputFieldProps {
  fieldTitle: string
  fieldKey: string
  units: string
  errorToShow?: string | null
}
interface MultiInputFieldProps {
  name: string
  tab: 'aspirate' | 'dispense'
  tooltipContent: string
  propsForFields: FieldPropsByName
  fields: StepInputFieldProps[]
  wellPosition?: boolean | null
  labwareId?: string | null
}

export function MultiInputField(props: MultiInputFieldProps): JSX.Element {
  const {
    name,
    tab,
    tooltipContent,
    wellPosition,
    fields,
    propsForFields,
    labwareId,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation(['protocol_steps', 'form', 'tooltip'])

  return (
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
          {wellPosition != null && (
            <PositionField
              padding="0"
              prefix={tab}
              propsForFields={propsForFields}
              zField={`${tab}_mmFromBottom`}
              xField={`${tab}_x_position`}
              yField={`${tab}_y_position`}
              labwareId={labwareId}
            />
          )}
        </Flex>
      </ListItem>
    </Flex>
  )
}
