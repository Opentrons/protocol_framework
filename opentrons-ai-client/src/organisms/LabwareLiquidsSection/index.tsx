import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  EmptySelectorButton,
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
import { useState } from 'react'
import { LabwareModal } from '../LabwareModal'
import { ControlledLabwareListItems } from '../../molecules/ControlledLabwareListItems'

export interface DisplayLabware {
  labwareURI: string
  count: number
}

export const ORDERED_CATEGORIES: string[] = [
  'tipRack',
  'tubeRack',
  'wellPlate',
  'reservoir',
  'aluminumBlock',
  'adapter',
]

export const LABWARES_FIELD_NAME = 'labwares'

export function LabwareLiquidsSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    watch,
  } = useFormContext()
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)
  const [displayLabwareModal, setDisplayLabwareModal] = useState(false)

  const labwares: DisplayLabware[] = watch(LABWARES_FIELD_NAME) ?? []

  function handleConfirmButtonClick(): void {
    const step = currentStep > MODULES_STEP ? currentStep : MODULES_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <EmptySelectorButton
        onClick={() => {
          setDisplayLabwareModal(true)
        }}
        text={t('add_opentrons_labware')}
        textAlignment={'left'}
        iconName="plus"
      />

      <LabwareModal
        displayLabwareModal={displayLabwareModal}
        setDisplayLabwareModal={setDisplayLabwareModal}
      />

      {labwares.length === 0 && (
        <InfoScreen content={t('no_labwares_added_yet')} />
      )}

      <ControlledLabwareListItems />

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
