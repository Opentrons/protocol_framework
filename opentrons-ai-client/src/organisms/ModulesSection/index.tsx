import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  InfoScreen,
  JUSTIFY_FLEX_END,
  LargeButton,
  SPACING,
} from '@opentrons/components'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAtom } from 'jotai'
import { createProtocolAtom } from '../../resources/atoms'
import { MODULES_STEP } from '../ProtocolSectionsContainer'
import { ControlledEmptySelectorButtonGroup } from '../../molecules/ControlledEmptySelectorButtonGroup'
import type { DisplayModules } from '../../molecules/ControlledEmptySelectorButtonGroup'
import { ModuleListItemGroup } from '../../molecules/ModuleListItemGroup'

export function ModulesSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    watch,
  } = useFormContext()
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)

  const modules: DisplayModules[] = [
    {
      type: 'heaterShakerModuleType',
      model: 'heaterShakerModuleV1',
      name: 'Heater-Shaker Module GEN1',
    },
    {
      type: 'temperatureModuleType',
      model: 'temperatureModuleV2',
      name: 'Temperature Module GEN2',
    },
    {
      type: 'thermocyclerModuleType',
      model: 'thermocyclerModuleV2',
      name: 'Thermocycler Module GEN2',
    },
    {
      type: 'magneticModuleType',
      model: 'magneticModuleV1',
      name: 'Magnetic Block GEN1',
    },
  ]

  function handleConfirmButtonClick(): void {
    const step = currentStep > MODULES_STEP ? currentStep : MODULES_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  const modulesWatch: DisplayModules[] = watch('modules') ?? []

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <ControlledEmptySelectorButtonGroup modules={modules} />

      {modulesWatch.length === 0 && (
        <InfoScreen content="No modules added yet" />
      )}

      <ModuleListItemGroup />

      <ButtonContainer>
        <LargeButton
          onClick={handleConfirmButtonClick}
          disabled={!isValid}
          buttonText={t('section_confirm_button')}
        ></LargeButton>
      </ButtonContainer>
    </Flex>
  )
}

const ButtonContainer = styled.div`
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_FLEX_END};
`
