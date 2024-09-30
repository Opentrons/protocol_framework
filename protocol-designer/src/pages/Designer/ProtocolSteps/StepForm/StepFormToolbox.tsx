import { useState } from 'react'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
  Toolbox,
} from '@opentrons/components'
import { stepIconsByType } from '../../../../form-types'
import { FormAlerts } from '../../../../organisms'
import { useKitchen } from '../../../../organisms/Kitchen/hooks'
import { getFormWarningsForSelectedStep } from '../../../../dismiss/selectors'
import { getTimelineWarningsForSelectedStep } from '../../../../top-selectors/timelineWarnings'
import { getRobotStateTimeline } from '../../../../file-data/selectors'
import {
  CommentTools,
  HeaterShakerTools,
  MagnetTools,
  MixTools,
  MoveLabwareTools,
  MoveLiquidTools,
  PauseTools,
  TemperatureTools,
  ThermocyclerTools,
} from './StepTools'
import { getSaveStepSnackbarText } from './utils'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData, StepType } from '../../../../form-types'
import type { FieldPropsByName, FocusHandlers, StepFormProps } from './types'

type StepFormMap = {
  [K in StepType]?: React.ComponentType<StepFormProps> | null
}

const STEP_FORM_MAP: StepFormMap = {
  mix: MixTools,
  pause: PauseTools,
  moveLabware: MoveLabwareTools,
  moveLiquid: MoveLiquidTools,
  magnet: MagnetTools,
  temperature: TemperatureTools,
  thermocycler: ThermocyclerTools,
  heaterShaker: HeaterShakerTools,
  comment: CommentTools,
}

interface StepFormToolboxProps {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: StepFieldName | null
  formData: FormData
  propsForFields: FieldPropsByName
  handleClose: () => void
  handleSave: () => void
}

export function StepFormToolbox(props: StepFormToolboxProps): JSX.Element {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleSave,
    propsForFields,
    dirtyFields,
    focusedField,
  } = props
  const { t, i18n } = useTranslation([
    'application',
    'shared',
    'protocol_steps',
  ])
  const { makeSnackbar } = useKitchen()
  const formWarningsForSelectedStep = useSelector(
    getFormWarningsForSelectedStep
  )
  const timelineWarningsForSelectedStep = useSelector(
    getTimelineWarningsForSelectedStep
  )
  const timeline = useSelector(getRobotStateTimeline)
  const [toolboxStep, setToolboxStep] = useState<number>(0)
  const icon = stepIconsByType[formData.stepType]

  const ToolsComponent: typeof STEP_FORM_MAP[keyof typeof STEP_FORM_MAP] = get(
    STEP_FORM_MAP,
    formData.stepType
  )

  if (!ToolsComponent) {
    // early-exit if step form doesn't exist, this is a good check for when new steps
    // are added
    return (
      <div>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }

  const isMultiStepToolbox =
    formData.stepType === 'moveLiquid' || formData.stepType === 'mix'
  const numWarnings =
    formWarningsForSelectedStep.length + timelineWarningsForSelectedStep.length
  const numErrors = timeline.errors?.length ?? 0

  const handleSaveClick = (): void => {
    handleSave()
    makeSnackbar(
      getSaveStepSnackbarText({
        numWarnings,
        numErrors,
        stepTypeDisplayName: i18n.format(
          t(`stepType.${formData.stepType}`),
          'capitalize'
        ),
        t,
      }) as string
    )
  }
  return (
    <>
      <Toolbox
        subHeader={
          isMultiStepToolbox ? (
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {t('shared:step', { current: toolboxStep + 1, max: 2 })}
            </StyledText>
          ) : null
        }
        childrenPadding="0"
        onCloseClick={handleClose}
        closeButtonText={t('shared:cancel')}
        confirmButton={
          <Flex gridGap={SPACING.spacing8}>
            {isMultiStepToolbox && toolboxStep === 1 ? (
              <SecondaryButton
                width="100%"
                onClick={() => {
                  setToolboxStep(0)
                }}
              >
                {i18n.format(t('shared:back'), 'capitalize')}
              </SecondaryButton>
            ) : null}
            <PrimaryButton
              onClick={
                isMultiStepToolbox && toolboxStep === 0
                  ? () => {
                      setToolboxStep(1)
                    }
                  : handleSaveClick
              }
              disabled={
                isMultiStepToolbox && toolboxStep === 0 ? false : !canSave
              }
              width="100%"
            >
              {isMultiStepToolbox && toolboxStep === 0
                ? i18n.format(t('shared:continue'), 'capitalize')
                : t('shared:save')}
            </PrimaryButton>
          </Flex>
        }
        height="calc(100vh - 64px)"
        title={
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <Icon size="1rem" name={icon} />
            <StyledText desktopStyle="bodyLargeSemiBold">
              {i18n.format(t(`stepType.${formData.stepType}`), 'capitalize')}
            </StyledText>
          </Flex>
        }
      >
        <FormAlerts focusedField={focusedField} dirtyFields={dirtyFields} />
        <ToolsComponent
          {...{
            formData,
            propsForFields,
            focusHandlers,
            toolboxStep,
          }}
        />
      </Toolbox>
    </>
  )
}