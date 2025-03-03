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
  const { t } = useTranslation(['liquids'])
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
    ? getLiquidClassDisplayName(assignedLiquidClasses[0] ?? null)
    : t('dont_use_liquid_class')

  const [selectedLiquidClass, setSelectedLiquidClass] = useState(
    defaultSelectedLiquidClass
  )

  useMemo(() => {
    setSelectedLiquidClass(defaultSelectedLiquidClass)
  }, [defaultSelectedLiquidClass])

  const liquidClassOptions = [
    ...Object.entries(liquidClassDefs)
      .sort(([_0, a], [_1, b]) => {
        if (a.displayName < b.displayName) {
          return -1
        } else if (a.displayName > b.displayName) {
          return 1
        }
        return 0
      })
      .map(([liquidClassDefName, { displayName, description }]) => ({
        name: displayName,
        value: liquidClassDefName,
        subButtonLabel:
          liquidClassToLiquidsMap[liquidClassDefName] != null
            ? t('assigned_liquid', {
                liquidName: liquidClassToLiquidsMap[liquidClassDefName].join(
                  ', '
                ),
              })
            : description,
      })),
    {
      name: t('dont_use_liquid_class'),
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
          {t('apply_liquid_classes')}
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
                propsForFields.transfer_liquid_classes_setting.updateValue(
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
