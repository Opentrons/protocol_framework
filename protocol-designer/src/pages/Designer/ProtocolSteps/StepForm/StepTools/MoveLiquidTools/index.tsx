import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getEnableLiquidClasses } from '../../../../../../feature-flags/selectors'
import { SingleStepMoveLiquidTools } from './SingleStepMoveLiquidTools'
import { MultipleStepsMoveLiquidTools } from './MultipleStepsMoveLiquidTools'

import type { StepFormProps } from '../../types'
import type { ChangeEvent } from 'react'
import { getAllLiquidClassDefs } from '@opentrons/shared-data'
import { getLiquidEntities } from '../../../../../../step-forms/selectors'

export function MoveLiquidTools(props: StepFormProps): JSX.Element {
  const {
    toolboxStep,
    propsForFields,
    formData,
    visibleFormErrors,
    setShowFormErrors,
    tab,
    setTab,
  } = props
  const { t } = useTranslation(['protocol_steps', 'form'])
  const enableLiquidClasses = useSelector(getEnableLiquidClasses)
  const liquids = useSelector(getLiquidEntities)
  const liquidClassDefs = getAllLiquidClassDefs()

  // Map assigned liquid classes to their respective liquids
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
    ? assignedLiquidClasses[0]
    : 'noLiquidClass'

  const [selectedLiquidClass, setSelectedLiquidClass] = useState(
    defaultSelectedLiquidClass
  )

  useMemo(() => {
    setSelectedLiquidClass(defaultSelectedLiquidClass)
  }, [defaultSelectedLiquidClass])

  const liquidClassOptions = [
    ...Object.entries(liquidClassDefs).map(
      ([liquidClassDefName, { displayName }]) => ({
        name: displayName,
        value: liquidClassDefName,
        subButtonLabel:
          liquidClassToLiquidsMap[liquidClassDefName] != null
            ? t('protocol_steps:assigned_liquid', {
                liquidName: liquidClassToLiquidsMap[liquidClassDefName].join(
                  ', '
                ),
              })
            : t(`protocol_steps:${liquidClassDefName}`),
      })
    ),
    {
      name: t('protocol_steps:no_liquid_class'),
      value: 'noLiquidClass',
      subButtonLabel: '',
    },
  ]

  if (!hasAssignedLiquidClasses) {
    liquidClassOptions.unshift(liquidClassOptions.pop()!)
  }

  return toolboxStep === 0 ? (
    <SingleStepMoveLiquidTools
      propsForFields={propsForFields}
      formData={formData}
      visibleFormErrors={visibleFormErrors}
    />
  ) : (
    <>
      {enableLiquidClasses ? (
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
              const { name, value, subButtonLabel } = options
              return (
                <RadioButton
                  key={name}
                  onChange={() => {
                    setSelectedLiquidClass(value)
                  }}
                  buttonLabel={name}
                  subButtonLabel={subButtonLabel}
                  buttonValue={value}
                  isSelected={selectedLiquidClass === value}
                  maxLines={1}
                  largeDesktopBorderRadius
                />
              )
            })}
          </Flex>
        </Flex>
      ) : null}
      <MultipleStepsMoveLiquidTools
        propsForFields={propsForFields}
        formData={formData}
        tab={tab}
        setTab={setTab}
        setShowFormErrors={setShowFormErrors}
        visibleFormErrors={visibleFormErrors}
      />
    </>
  )
}
