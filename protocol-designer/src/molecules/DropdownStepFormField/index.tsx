import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  COLORS,
  DIRECTION_COLUMN,
  DropdownMenu,
  Flex,
  ListItem,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { selectDropdownItem } from '../../ui/steps/actions/actions'
import type { Options } from '@opentrons/components'
import type { FieldProps } from '../../pages/Designer/ProtocolSteps/StepForm/types'

export interface DropdownStepFormFieldProps extends FieldProps {
  options: Options
  title: string
  width?: string
  onEnter?: (id: string) => void
  onExit?: () => void
}

const FIRST_FIELDS = ['aspirate_labware', 'labware', 'moduleId']
const SECOND_FIELDS = ['dispense_labware', 'newLocation']

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
    onEnter,
    onExit,
    onFieldBlur,
    name: fieldName,
  } = props
  const { t } = useTranslation(['tooltip', 'application'])
  const dispatch = useDispatch()
  const availableOptionId = options.find(opt => opt.value === value)
  const handleSelection = (value: string): void => {
    let text = t('application:selected')
    if (fieldName === 'newLocation') {
      text = t('application:location')
    } else if (fieldName === 'aspirate_labware') {
      text = t('application:source')
    } else if (fieldName === 'dispense_labware') {
      text = t('application:dest')
    }

    const selection = {
      id: value,
      text,
    }
    if (FIRST_FIELDS.includes(fieldName)) {
      dispatch(
        selectDropdownItem({
          selection: { ...selection, field: '1' },
          mode: 'add',
        })
      )
    } else if (SECOND_FIELDS.includes(fieldName)) {
      dispatch(
        selectDropdownItem({
          selection: { ...selection, field: '2' },
          mode: 'add',
        })
      )
    }
  }

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
            handleSelection(value)
          }}
          onEnter={onEnter}
          onExit={onExit}
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
