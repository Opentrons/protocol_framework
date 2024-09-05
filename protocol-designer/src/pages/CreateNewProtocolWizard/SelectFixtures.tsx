import * as React from 'react'
import { useTranslation } from 'react-i18next'
import without from 'lodash/without'
import { THERMOCYCLER_MODULE_V2 } from '@opentrons/shared-data'
import {
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  ListItem,
  ListItemCustomize,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import { useKitchen } from '../../organisms/Kitchen/hooks'
import { WizardBody } from './WizardBody'
import {
  AdditionalEquipmentDiagram,
  getNumOptions,
  getNumSlotsAvailable,
} from './utils'
import { HandleEnter } from './HandleEnter'

import type { DropdownBorder } from '@opentrons/components'
import type { AdditionalEquipment, WizardTileProps } from './types'

const MAX_SLOTS = 4
const ADDITIONAL_EQUIPMENTS: AdditionalEquipment[] = [
  'wasteChute',
  'trashBin',
  'stagingArea',
]
export function SelectFixtures(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, setValue, watch } = props
  const { makeSnackbar } = useKitchen()
  const additionalEquipment = watch('additionalEquipment')
  const modules = watch('modules')
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const numSlotsAvailable = getNumSlotsAvailable(modules, additionalEquipment)

  const hasTC =
    modules != null &&
    Object.values(modules).some(
      module => module.model === THERMOCYCLER_MODULE_V2
    )
  const hasTrash = additionalEquipment.some(
    ae => ae === 'trashBin' || ae === 'wasteChute'
  )
  const filteredAdditionalEquipmentWithoutGripper = additionalEquipment.filter(
    ae => ae !== 'gripper'
  )
  const filteredDuplicateStagingAreas = Array.from(
    new Set(filteredAdditionalEquipmentWithoutGripper)
  )
  const filteredAdditionalEquipment = ADDITIONAL_EQUIPMENTS.filter(
    equipment => !filteredAdditionalEquipmentWithoutGripper.includes(equipment)
  )

  const handleProceed = (): void => {
    if (!hasTrash) {
      makeSnackbar(t('trash_required') as string)
    } else {
      proceed(1)
    }
  }

  return (
    <HandleEnter onEnter={handleProceed}>
      <WizardBody
        stepNumber={5}
        header={t('add_fixtures')}
        subHeader={t('fixtures_replace')}
        disabled={!hasTrash}
        goBack={() => {
          goBack(1)
        }}
        proceed={handleProceed}
      >
        <Flex marginTop={SPACING.spacing60} flexDirection={DIRECTION_COLUMN}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              desktopStyle="headingSmallBold"
              marginBottom={SPACING.spacing12}
            >
              {t('which_fixtures')}
            </StyledText>
          </Flex>
          <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
            {filteredAdditionalEquipment.map(equipment => (
              <EmptySelectorButton
                disabled={numSlotsAvailable === 0}
                key={equipment}
                textAlignment={TYPOGRAPHY.textAlignLeft}
                size="small"
                iconName="plus"
                text={t(`${equipment}`)}
                onClick={() => {
                  if (numSlotsAvailable === 0) {
                    makeSnackbar(t('slots_limit_reached') as string)
                  } else {
                    setValue('additionalEquipment', [
                      ...additionalEquipment,
                      equipment,
                    ])
                  }
                }}
              />
            ))}
          </Flex>
          <Flex marginTop={SPACING.spacing32} flexDirection={DIRECTION_COLUMN}>
            <StyledText
              desktopStyle="headingSmallBold"
              marginBottom={SPACING.spacing12}
            >
              {t('fixtures_added')}
            </StyledText>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {filteredDuplicateStagingAreas.map(ae => {
                const numStagingAreas = filteredAdditionalEquipmentWithoutGripper.filter(
                  additionalEquipment => additionalEquipment === 'stagingArea'
                )?.length

                const dropdownProps = {
                  currentOption: {
                    name: numStagingAreas.toString(),
                    value: numStagingAreas.toString(),
                  },
                  dropdownType: 'neutral' as DropdownBorder,
                  filterOptions: getNumOptions(
                    numSlotsAvailable >= MAX_SLOTS
                      ? MAX_SLOTS
                      : numSlotsAvailable + numStagingAreas - (hasTC ? 1 : 0)
                  ),
                  onClick: (value: string) => {
                    const inputNum = parseInt(value)
                    let updatedStagingAreas = [...additionalEquipment]

                    if (inputNum > numStagingAreas) {
                      const difference = inputNum - numStagingAreas
                      updatedStagingAreas = [
                        ...updatedStagingAreas,
                        ...Array(difference).fill(ae),
                      ]
                    } else {
                      updatedStagingAreas = updatedStagingAreas.slice(
                        0,
                        inputNum
                      )
                    }

                    setValue('additionalEquipment', updatedStagingAreas)
                  },
                }
                return (
                  <ListItem type="noActive" key={ae}>
                    <ListItemCustomize
                      linkText={t('remove')}
                      onClick={() => {
                        setValue(
                          'additionalEquipment',
                          without(additionalEquipment, ae)
                        )
                      }}
                      label={ae === 'stagingArea' ? t('quantity') : null}
                      dropdown={
                        ae === 'stagingArea' ? dropdownProps : undefined
                      }
                      header={t(`${ae}`)}
                      leftHeaderItem={
                        <AdditionalEquipmentDiagram additionalEquipment={ae} />
                      }
                    />
                  </ListItem>
                )
              })}
            </Flex>
          </Flex>
        </Flex>
      </WizardBody>
    </HandleEnter>
  )
}