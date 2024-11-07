import {
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  EmptySelectorButton,
  Flex,
  InputField,
  JUSTIFY_FLEX_END,
  LargeButton,
  SPACING,
  StyledText,
  Tabs,
} from '@opentrons/components'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAtom } from 'jotai'
import { createProtocolAtom } from '../../resources/atoms'
import { STEPS_STEP } from '../ProtocolSectionsContainer'
import { useState } from 'react'
import { COLUMN } from '@opentrons/shared-data'
import { ControlledAddInputFields } from '../../molecules/ControlledAddInputFields'

export const STEPS_FIELD_NAME = 'steps'

export function StepsSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    setValue,
    watch,
  } = useFormContext()
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)
  const [isIndividualStep, setIsIndividualStep] = useState(true)

  const steps = watch(STEPS_FIELD_NAME) ?? []

  function handleConfirmButtonClick(): void {
    const step = currentStep > STEPS_STEP ? currentStep : STEPS_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing16}
    >
      <StyledText color={COLORS.grey60} desktopStyle="headingSmallRegular">
        {t('steps_section_textbody')}
      </StyledText>

      <Tabs
        tabs={[
          {
            text: t('add_individual_step'),
            onClick: () => {
              setIsIndividualStep(true)
            },
            isActive: isIndividualStep,
            disabled: false,
          },
          {
            text: t('paste_from_document'),
            onClick: () => {
              setIsIndividualStep(false)
            },
            isActive: !isIndividualStep,
            disabled: false,
          },
        ]}
      ></Tabs>

      <Flex
        flexDirection={DIRECTION_COLUMN}
        gap={SPACING.spacing10}
        padding={SPACING.spacing16}
        backgroundColor={COLORS.grey20}
      >
        {isIndividualStep ? (
          <>
            <EmptySelectorButton
              onClick={() => {
                setValue(STEPS_FIELD_NAME, [...steps, ''])
              }}
              text={t('add_step')}
              textAlignment={'left'}
              iconName="plus"
            />

            <ControlledAddInputFields
              fieldName={STEPS_FIELD_NAME}
              name={t('step').toLowerCase()}
            />
          </>
        ) : (
          <>
            <StyledText
              color={COLORS.grey60}
              desktopStyle="headingSmallRegular"
            >
              {t('paste_from_document_title')}
            </StyledText>

            <Flex
              flexDirection={COLUMN}
              gap={SPACING.spacing4}
              color={COLORS.grey60}
            >
              <InputField title={t('paste_from_document_input_title')} />
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('paste_from_document_input_caption_1')}
              </StyledText>
              <ExampleOrderedList>
                <li>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('paste_from_document_input_caption_2')}
                  </StyledText>
                </li>
                <li>
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {t('paste_from_document_input_caption_3')}
                  </StyledText>
                </li>
              </ExampleOrderedList>
            </Flex>
          </>
        )}
      </Flex>

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

const ExampleOrderedList = styled.ol`
  margin-left: ${SPACING.spacing20};
  font-size: 14px;
`
