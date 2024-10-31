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
import { ModuleListItemGroup } from '../../molecules/ModuleListItemGroup'
import type { ModuleType, ModuleModel } from '@opentrons/shared-data'

export interface DisplayModules {
  type: ModuleType
  model: ModuleModel
  name: string
  adapter?: string
}

export const MODULES_FIELD_NAME = 'modules'

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
      name: t('heater_shaker_module_v1'),
    },
    {
      type: 'temperatureModuleType',
      model: 'temperatureModuleV2',
      name: t('temperature_module_v2'),
    },
    {
      type: 'thermocyclerModuleType',
      model: 'thermocyclerModuleV2',
      name: t('thermocycler_module_v2'),
    },
    {
      type: 'magneticModuleType',
      model: 'magneticModuleV1',
      name: t('magnetic_module_v1'),
    },
  ]

  function handleConfirmButtonClick(): void {
    const step = currentStep > MODULES_STEP ? currentStep : MODULES_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  const modulesWatch: DisplayModules[] = watch(MODULES_FIELD_NAME) ?? []

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <ControlledEmptySelectorButtonGroup modules={modules} />

      {modulesWatch.length === 0 && (
        <InfoScreen content={t('no_modules_added_yet')} />
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
