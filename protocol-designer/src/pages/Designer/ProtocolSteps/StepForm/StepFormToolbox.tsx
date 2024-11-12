import { useEffect, useRef, useState } from 'react'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  POSITION_RELATIVE,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  Toolbox,
  TYPOGRAPHY,
} from '@opentrons/components'
import { stepIconsByType } from '../../../../form-types'
import { FormAlerts } from '../../../../organisms'
import { useKitchen } from '../../../../organisms/Kitchen/hooks'
import { RenameStepModal } from '../../../../organisms/RenameStepModal'
import { getFormWarningsForSelectedStep } from '../../../../dismiss/selectors'
import { getTimelineWarningsForSelectedStep } from '../../../../top-selectors/timelineWarnings'
import { getRobotStateTimeline } from '../../../../file-data/selectors'
import { BUTTON_LINK_STYLE, LINE_CLAMP_TEXT_STYLE } from '../../../../atoms'
import { analyticsEvent } from '../../../../analytics/actions'
import {
  getFormLevelErrorsForUnsavedForm,
  getDynamicFieldFormErrorsForUnsavedForm,
} from '../../../../step-forms/selectors'
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
import {
  getSaveStepSnackbarText,
  getVisibleFormErrors,
  getVisibleFormWarnings,
  capitalizeFirstLetter,
  getIsErrorOnCurrentPage,
} from './utils'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData, StepType } from '../../../../form-types'
import type { AnalyticsEvent } from '../../../../analytics/mixpanel'
import type {
  FieldPropsByName,
  FocusHandlers,
  LiquidHandlingTab,
  StepFormProps,
} from './types'

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
  const dispatch = useDispatch()
  const { makeSnackbar } = useKitchen()
  const toolsComponentRef = useRef<HTMLDivElement | null>(null)
  const [analyticsStartTime] = useState<Date>(new Date())
  const formWarningsForSelectedStep = useSelector(
    getFormWarningsForSelectedStep
  )
  const timelineWarningsForSelectedStep = useSelector(
    getTimelineWarningsForSelectedStep
  )
  const formLevelErrorsForUnsavedForm = useSelector(
    getFormLevelErrorsForUnsavedForm
  )
  const dynamicFormLevelErrorsForUnsavedForm = useSelector(
    getDynamicFieldFormErrorsForUnsavedForm
  ).map(error => ({
    title: error.title,
    body: error.body,
    dependentFields: error.dependentProfileFields,
  }))
  const timeline = useSelector(getRobotStateTimeline)
  const [toolboxStep, setToolboxStep] = useState<number>(0)
  const [
    showFormErrorsAndWarnings,
    setShowFormErrorsAndWarnings,
  ] = useState<boolean>(false)
  const [tab, setTab] = useState<LiquidHandlingTab>('aspirate')
  const visibleFormWarnings = getVisibleFormWarnings({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formWarningsForSelectedStep,
  })
  const visibleFormErrors = getVisibleFormErrors({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: [
      ...formLevelErrorsForUnsavedForm,
      ...dynamicFormLevelErrorsForUnsavedForm,
    ],
    page: toolboxStep,
    showErrors: showFormErrorsAndWarnings,
  })
  const [isRename, setIsRename] = useState<boolean>(false)
  const icon = stepIconsByType[formData.stepType]

  const ToolsComponent: typeof STEP_FORM_MAP[keyof typeof STEP_FORM_MAP] = get(
    STEP_FORM_MAP,
    formData.stepType
  )

  const isAspirateError = formLevelErrorsForUnsavedForm.some(
    error => error.tab === 'aspirate' && error.page === toolboxStep
  )
  const isDispenseError = formLevelErrorsForUnsavedForm.some(
    error => error.tab === 'dispense' && error.page === toolboxStep
  )

  const visibleFormWarningsTypes = visibleFormWarnings.map(
    warning => warning.type
  )
  const visibleFormErrorsTypes = visibleFormErrors.map(error => error.title)

  useEffect(() => {
    if (visibleFormWarningsTypes.length > 0) {
      const formWarningsEvent: AnalyticsEvent = {
        name: 'formWarnings',
        properties: { visibleFormWarningsTypes },
      }
      dispatch(analyticsEvent(formWarningsEvent))
    }
    if (visibleFormErrorsTypes.length > 0) {
      const formErrorsEvent: AnalyticsEvent = {
        name: 'formErrors',
        properties: { visibleFormErrorsTypes },
      }
      dispatch(analyticsEvent(formErrorsEvent))
    }
  }, [visibleFormWarningsTypes, visibleFormErrorsTypes])

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
    formData.stepType === 'moveLiquid' ||
    formData.stepType === 'mix' ||
    formData.stepType === 'thermocycler'
  const numWarnings =
    visibleFormWarnings.length + timelineWarningsForSelectedStep.length
  const numErrors = timeline.errors?.length ?? 0

  const isErrorOnCurrentPage = getIsErrorOnCurrentPage({
    errors: formLevelErrorsForUnsavedForm,
    page: toolboxStep,
  })
  const handleScrollToTop = (): void => {
    if (toolsComponentRef.current) {
      toolsComponentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const handleSaveClick = (): void => {
    if (canSave) {
      const duration = new Date().getTime() - analyticsStartTime.getTime()
      const stepDuration: AnalyticsEvent = {
        name: 'stepDuration',
        properties: {
          stepType: formData.stepType,
          duration: `${duration / 1000} seconds`,
        },
      }
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
        })
      )
      dispatch(analyticsEvent(stepDuration))
    } else {
      setShowFormErrorsAndWarnings(true)
      if (tab === 'aspirate' && isDispenseError && !isAspirateError) {
        setTab('dispense')
      }
      if (tab === 'dispense' && isAspirateError && !isDispenseError) {
        setTab('aspirate')
      }
      handleScrollToTop()
    }
  }

  const handleContinue = (): void => {
    if (isMultiStepToolbox && toolboxStep === 0) {
      if (!isErrorOnCurrentPage) {
        setToolboxStep(1)
        setShowFormErrorsAndWarnings(false)
      } else {
        setShowFormErrorsAndWarnings(true)
        handleScrollToTop()
      }
    } else {
      handleSaveClick()
    }
  }

  return (
    <>
      {isRename ? (
        <RenameStepModal
          formData={formData}
          onClose={() => {
            setIsRename(false)
          }}
        />
      ) : null}
      <Toolbox
        position={POSITION_RELATIVE}
        subHeader={
          isMultiStepToolbox ? (
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {t('shared:part', { current: toolboxStep + 1, max: 2 })}
            </StyledText>
          ) : null
        }
        secondaryHeaderButton={
          <Btn
            onClick={() => {
              setIsRename(true)
            }}
            css={BUTTON_LINK_STYLE}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('protocol_steps:rename')}
            </StyledText>
          </Btn>
        }
        childrenPadding="0"
        onCloseClick={handleClose}
        closeButton={<Icon size="2rem" name="close" />}
        confirmButton={
          <Flex gridGap={SPACING.spacing8}>
            {isMultiStepToolbox && toolboxStep === 1 ? (
              <SecondaryButton
                width="100%"
                onClick={() => {
                  setToolboxStep(0)
                  setShowFormErrorsAndWarnings(false)
                }}
              >
                {i18n.format(t('shared:back'), 'capitalize')}
              </SecondaryButton>
            ) : null}
            <PrimaryButton onClick={handleContinue} width="100%">
              {isMultiStepToolbox && toolboxStep === 0
                ? i18n.format(t('shared:continue'), 'capitalize')
                : t('shared:save')}
            </PrimaryButton>
          </Flex>
        }
        title={
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <Icon size="1rem" name={icon} minWidth="1rem" />
            <StyledText
              desktopStyle="bodyLargeSemiBold"
              css={LINE_CLAMP_TEXT_STYLE(2)}
            >
              {capitalizeFirstLetter(String(formData.stepName))}
            </StyledText>
          </Flex>
        }
      >
        <div ref={toolsComponentRef}>
          <FormAlerts
            focusedField={focusedField}
            dirtyFields={dirtyFields}
            showFormErrorsAndWarnings={showFormErrorsAndWarnings}
            page={toolboxStep}
          />
          <ToolsComponent
            {...{
              formData,
              propsForFields,
              focusHandlers,
              toolboxStep,
              visibleFormErrors,
              showFormErrors: showFormErrorsAndWarnings,
              focusedField,
              setShowFormErrorsAndWarnings,
              tab,
              setTab,
            }}
          />
        </div>
      </Toolbox>
    </>
  )
}
