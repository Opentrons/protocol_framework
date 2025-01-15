import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { ToggleStepFormField } from '../../../../../../molecules'

import type { FieldProps } from '../../types'

interface LidControlsProps {
  fieldProps: FieldProps
  label?: string
  paddingX?: string
}

export function LidControls(props: LidControlsProps): JSX.Element {
  const { fieldProps, label, paddingX = '0' } = props
  const { t } = useTranslation('form')
  return (
    <Flex
      width="100%"
      paddingX={paddingX}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
    >
      {label != null ? (
        <StyledText desktopStyle="bodyDefaultSemiBold">{label}</StyledText>
      ) : null}
      <ToggleStepFormField
        title={t('lid_position')}
        isSelected={fieldProps.value === true}
        onLabel={t('open')}
        offLabel={t('closed')}
        toggleUpdateValue={() => {
          fieldProps.updateValue(!fieldProps.value)
        }}
        toggleValue={fieldProps.value}
        isDisabled={false}
        tooltipContent={null}
      />
    </Flex>
  )
}
