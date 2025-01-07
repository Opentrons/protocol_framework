import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { ModalShell } from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import {
  BeforeBeginning,
  CheckItem,
  AttachProbe,
  DetachProbe,
  ResultsSummary,
} from '/app/organisms/LabwarePositionCheck/steps'
import {
  RobotMotionLoader,
  ExitConfirmation,
} from '/app/organisms/LabwarePositionCheck/shared'
import { WizardHeader } from '/app/molecules/WizardHeader'
import { getIsOnDevice } from '/app/redux/config'
import { LPCErrorModal } from './LPCErrorModal'
import { getLPCSteps } from './utils'
import {
  useLPCCommands,
  useLPCInitialState,
} from '/app/organisms/LabwarePositionCheck/hooks'
import { useLPCReducer } from '/app/organisms/LabwarePositionCheck/redux'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'
import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'

import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function LPCWizardFlex(
  props: Omit<LPCFlowsProps, 'robotType'>
): JSX.Element {
  const { mostRecentAnalysis } = props
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const isOnDevice = useSelector(getIsOnDevice)
  const labwareDefs = useMemo(
    () => getLabwareDefinitionsFromCommands(mostRecentAnalysis.commands),
    [mostRecentAnalysis]
  )

  const LPCSteps = getLPCSteps({
    protocolData: mostRecentAnalysis,
    labwareDefs,
  })
  const totalStepCount = LPCSteps.length - 1
  const currentStep = LPCSteps?.[currentStepIndex]
  const proceed = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== LPCSteps.length - 1
        ? currentStepIndex + 1
        : currentStepIndex
    )
  }

  // TOME TODO: Like with ER, separate wizard and content. The wizard injects the data layer to the content layer.

  const initialState = useLPCInitialState()
  const { state, dispatch } = useLPCReducer(initialState)

  const LPCHandlerUtils = useLPCCommands({ ...props, step: currentStep })

  return (
    <LPCWizardFlexComponent
      step={currentStep}
      protocolData={mostRecentAnalysis}
      proceed={proceed}
      dispatch={dispatch}
      state={state}
      currentStepIndex={currentStepIndex}
      totalStepCount={totalStepCount}
      isOnDevice={isOnDevice}
      labwareDefs={labwareDefs}
      commandUtils={LPCHandlerUtils}
      {...props}
    />
  )
}

function LPCWizardFlexComponent(props: LPCWizardContentProps): JSX.Element {
  return createPortal(
    props.isOnDevice ? (
      <ModalShell fullPage>
        <LPCWizardHeader {...props} />
        <LPCWizardContent {...props} />
      </ModalShell>
    ) : (
      <ModalShell width="47rem" header={<LPCWizardHeader {...props} />}>
        <LPCWizardContent {...props} />
      </ModalShell>
    ),
    getTopPortalEl()
  )
}

function LPCWizardHeader({
  currentStepIndex,
  totalStepCount,
  commandUtils,
}: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const {
    errorMessage,
    showExitConfirmation,
    isExiting,
    confirmExitLPC,
  } = commandUtils

  return (
    <WizardHeader
      title={t('labware_position_check_title')}
      currentStep={errorMessage != null ? undefined : currentStepIndex}
      totalSteps={errorMessage != null ? undefined : totalStepCount}
      onExit={
        showExitConfirmation || isExiting || errorMessage != null
          ? undefined
          : confirmExitLPC
      }
    />
  )
}

function LPCWizardContent(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('shared')
  const { step, ...restProps } = props
  const {
    isExiting,
    isRobotMoving,
    errorMessage,
    showExitConfirmation,
  } = props.commandUtils

  // Handle special cases first.
  if (isExiting || isRobotMoving) {
    return <RobotMotionLoader header={t('stand_back_robot_is_in_motion')} />
  }
  if (errorMessage != null) {
    return <LPCErrorModal {...props} />
  }
  if (showExitConfirmation) {
    return <ExitConfirmation {...props} />
  }

  // Handle step-based routing.
  switch (step.section) {
    case NAV_STEPS.BEFORE_BEGINNING:
      return <BeforeBeginning step={step} {...restProps} />

    case NAV_STEPS.CHECK_POSITIONS:
      return <CheckItem step={step} {...restProps} />

    case NAV_STEPS.ATTACH_PROBE:
      return <AttachProbe step={step} {...restProps} />

    case NAV_STEPS.DETACH_PROBE:
      return <DetachProbe step={step} {...restProps} />

    case NAV_STEPS.RESULTS_SUMMARY:
      return <ResultsSummary step={step} {...restProps} />

    default:
      console.error('Unhandled LPC step.')
      return <BeforeBeginning step={step} {...restProps} />
  }
}
