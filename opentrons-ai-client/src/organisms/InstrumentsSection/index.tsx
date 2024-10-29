import {
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_FLEX_END,
  LargeButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useAtom } from 'jotai'
import { createProtocolAtom } from '../../resources/atoms'
import { INSTRUMENTS_STEP } from '../ProtocolSectionsContainer'
import { ControlledDropdownMenu } from '../../atoms/ControlledDropdownMenu'
import { ControlledRadioButtonGroup } from '../../molecules/ControlledRadioButtonGroup'

export const ROBOT_FIELD_NAME = 'instruments.robot'
export const PIPETTES_FIELD_NAME = 'instruments.pipettes'
export const FLEX_GRIPPER_FIELD_NAME = 'instruments.flex_gripper'
export const FLEX_GRIPPER = 'flex_gripper'
export const NO_FLEX_GRIPPER = 'no_flex_gripper'
export const OPENTRONS_FLEX = 'opentrons_flex'
export const OPENTRONS_OT2 = 'opentrons_ot2'
export const _96_CHANNEL_1000UL_PIPETTE = '96_channel_1000ul_pipette'
export const TWO_PIPETTES = 'two_pipettes'

export function InstrumentsSection(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const {
    formState: { isValid },
    watch,
  } = useFormContext()
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)

  // const leftMountOptions = [
  //   { name: t(BASIC_ALIQUOTING), value: BASIC_ALIQUOTING },
  //   { name: t(PCR), value: PCR },
  //   { name: t(OTHER), value: OTHER },
  // ]

  // const rightMountOptions = [
  //   { name: t(BASIC_ALIQUOTING), value: BASIC_ALIQUOTING },
  //   { name: t(PCR), value: PCR },
  //   { name: t(OTHER), value: OTHER },
  // ]

  const isOtherPipettesSelected = watch(PIPETTES_FIELD_NAME) === TWO_PIPETTES
  const isOpentronsOT2Selected = watch(ROBOT_FIELD_NAME) === OPENTRONS_OT2

  function handleConfirmButtonClick(): void {
    const step =
      currentStep > INSTRUMENTS_STEP ? currentStep : INSTRUMENTS_STEP + 1

    setCreateProtocolAtom({
      currentStep: step,
      focusStep: step,
    })
  }

  const robotOptions = [
    {
      id: OPENTRONS_FLEX,
      buttonLabel: t('opentrons_flex_label'),
      buttonValue: OPENTRONS_FLEX,
    },
    {
      id: OPENTRONS_OT2,
      buttonLabel: t('opentrons_ot2_label'),
      buttonValue: OPENTRONS_OT2,
    },
  ]

  const pipetteOptions = [
    {
      id: TWO_PIPETTES,
      buttonLabel: t('two_pipettes_label'),
      buttonValue: TWO_PIPETTES,
    },
    {
      id: _96_CHANNEL_1000UL_PIPETTE,
      buttonLabel: t('96_channel_1000ul_pipette_label'),
      buttonValue: _96_CHANNEL_1000UL_PIPETTE,
    },
  ]

  const flexGripperOptions = [
    {
      id: FLEX_GRIPPER,
      buttonLabel: t('flex_gripper_yes_label'),
      buttonValue: FLEX_GRIPPER,
    },
    {
      id: NO_FLEX_GRIPPER,
      buttonLabel: t('flex_gripper_no_label'),
      buttonValue: NO_FLEX_GRIPPER,
    },
  ]

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      height="100%"
      gap={SPACING.spacing24}
    >
      <ControlledRadioButtonGroup
        radioButtons={robotOptions}
        title={t('instruments_robot_title')}
        name={ROBOT_FIELD_NAME}
        defaultValue={OPENTRONS_FLEX}
      />

      <PipettesSection isOpentronsOT2Selected={isOpentronsOT2Selected}>
        {!isOpentronsOT2Selected && (
          <ControlledRadioButtonGroup
            radioButtons={pipetteOptions}
            title={t('instruments_pipettes_title')}
            name={PIPETTES_FIELD_NAME}
            defaultValue={_96_CHANNEL_1000UL_PIPETTE}
          />
        )}

        {(isOtherPipettesSelected || isOpentronsOT2Selected) && (
          <PipettesDropdown isOpentronsOT2Selected={isOpentronsOT2Selected}>
            {isOpentronsOT2Selected && (
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('instruments_pipettes_title')}
              </StyledText>
            )}
            <ControlledDropdownMenu
              width="100%"
              dropdownType="neutral"
              title={t('left_pipette_label')}
              name={''}
              options={[]}
              placeholder={t('choose_pipette_placeholder')}
            />
            <ControlledDropdownMenu
              width="100%"
              dropdownType="neutral"
              title={t('right_pipette_label')}
              name={''}
              options={[]}
              placeholder={t('choose_pipette_placeholder')}
            />
          </PipettesDropdown>
        )}
      </PipettesSection>

      {!isOpentronsOT2Selected && (
        <ControlledRadioButtonGroup
          radioButtons={flexGripperOptions}
          title={t('instruments_flex_gripper_title')}
          name={FLEX_GRIPPER_FIELD_NAME}
          defaultValue={FLEX_GRIPPER}
        />
      )}

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

const PipettesDropdown = styled.div<{ isOpentronsOT2Selected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props =>
    props.isOpentronsOT2Selected ?? false
      ? SPACING.spacing16
      : SPACING.spacing8};
`

const PipettesSection = styled.div<{ isOpentronsOT2Selected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props =>
    props.isOpentronsOT2Selected ?? false
      ? SPACING.spacing16
      : SPACING.spacing8};
`
