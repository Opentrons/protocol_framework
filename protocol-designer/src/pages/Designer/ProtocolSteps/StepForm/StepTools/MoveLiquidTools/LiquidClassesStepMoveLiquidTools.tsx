import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getAllLiquidClassDefs } from '@opentrons/shared-data'
import { getLiquidEntities } from '../../../../../../step-forms/selectors'
import { getLiquidClassDisplayName } from '../../../../../../liquid-defs/utils'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { FieldPropsByName } from '../../types'
import type { StepFormErrors } from '../../../../../../steplist'
import type { FormData } from '../../../../../../form-types'

interface LiquidClassesStepMoveLiquidToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  setShowFormErrors?: Dispatch<SetStateAction<boolean>>
  visibleFormErrors: StepFormErrors
}
export const LiquidClassesStepMoveLiquidTools = ({
  propsForFields,
  formData,
  setShowFormErrors,
  visibleFormErrors,
}: LiquidClassesStepMoveLiquidToolsProps): JSX.Element => {
  const { t } = useTranslation(['protocol_steps'])
  const liquids = useSelector(getLiquidEntities)
  const liquidClassDefs = getAllLiquidClassDefs()

  const liquidClassToLiquidsMap: Record<string, string[]> = {}
  Object.values(liquids).forEach(({ displayName, liquidClass }) => {
    if (liquidClass) {
      if (!liquidClassToLiquidsMap[liquidClass]) {
        liquidClassToLiquidsMap[liquidClass] = []
      }
      liquidClassToLiquidsMap[liquidClass].push(displayName)
    }
  })

  const assignedLiquidClasses = Object.values(liquids)
    .map(liquid => liquid.liquidClass)
    .filter(Boolean)
  const hasAssignedLiquidClasses = assignedLiquidClasses.length > 0

  const defaultSelectedLiquidClass = hasAssignedLiquidClasses
    ? t(
        `protocol_steps:liquid_classes.${getLiquidClassDisplayName(
          assignedLiquidClasses[0] ?? null
        )
          ?.split('-')[0]
          .toLowerCase()}`
      )
    : t('protocol_steps:no_liquid_class')

  const [selectedLiquidClass, setSelectedLiquidClass] = useState(
    defaultSelectedLiquidClass
  )

  useMemo(() => {
    setSelectedLiquidClass(defaultSelectedLiquidClass)
  }, [defaultSelectedLiquidClass])

  const liquidClassOptions = [
    ...Object.entries(liquidClassDefs).map(
      ([liquidClassDefName, { displayName }]) => ({
        name: t(
          `protocol_steps:liquid_classes.${displayName
            .split('-')[0]
            .toLowerCase()}`
        ),
        value: liquidClassDefName,
        subButtonLabel:
          liquidClassToLiquidsMap[liquidClassDefName] != null
            ? t('protocol_steps:assigned_liquid', {
                liquidName: liquidClassToLiquidsMap[liquidClassDefName].join(
                  ', '
                ),
              })
            : t(
                `protocol_steps:liquid_classes.${displayName
                  .split('-')[0]
                  .toLowerCase()}_subtext`
              ),
      })
    ),
    {
      name: t('protocol_steps:no_liquid_class'),
      value: '',
      subButtonLabel: '',
    },
  ]
  if (!hasAssignedLiquidClasses) {
    const poppedOption = liquidClassOptions.pop()
    if (poppedOption !== undefined) {
      liquidClassOptions.unshift(poppedOption)
    }
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      paddingY={SPACING.spacing16}
      gridGap={SPACING.spacing12}
    >
      <Flex padding={`0 ${SPACING.spacing16}`}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('protocol_steps:apply_liquid_classes')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
        padding={`0 ${SPACING.spacing16}`}
      >
        {liquidClassOptions.map(options => {
          const { name, subButtonLabel, value } = options
          return (
            <RadioButton
              key={name}
              onChange={(e: ChangeEvent<any>) => {
                propsForFields.liquid_classes_setting.updateValue(
                  e.currentTarget.value
                )
                setSelectedLiquidClass(name)
              }}
              buttonLabel={name}
              subButtonLabel={subButtonLabel}
              buttonValue={value}
              isSelected={selectedLiquidClass === name}
              largeDesktopBorderRadius
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
