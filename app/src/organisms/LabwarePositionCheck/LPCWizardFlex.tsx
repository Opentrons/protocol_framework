import { createPortal } from 'react-dom'
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
import { ExitConfirmation } from './ExitConfirmation'
import { RobotMotionLoader } from './RobotMotionLoader'
import { WizardHeader } from '/app/molecules/WizardHeader'
import { LPCErrorModal } from './LPCErrorModal'
import {
  useLPCCommands,
  useLPCInitialState,
} from '/app/organisms/LabwarePositionCheck/hooks'
import {
  proceedStep,
  useLPCReducer,
} from '/app/organisms/LabwarePositionCheck/redux'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'

import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export interface LPCWizardFlexProps extends Omit<LPCFlowsProps, 'robotType'> {}

export function LPCWizardFlex(props: LPCWizardFlexProps): JSX.Element {
  const initialState = useLPCInitialState({ ...props })
  const { state, dispatch } = useLPCReducer(initialState)

  const LPCHandlerUtils = useLPCCommands({ ...props, state })

  // TODO(jh, 01-14-25): Also inject goBack functionality once designs are finalized.
  const proceed = (): void => {
    dispatch(proceedStep())
  }

  return (
    <LPCWizardFlexComponent
      proceed={proceed}
      dispatch={dispatch}
      state={state}
      commandUtils={LPCHandlerUtils}
      {...props}
    />
  )
}

function LPCWizardFlexComponent(props: LPCWizardContentProps): JSX.Element {
  return createPortal(
    props.state.isOnDevice ? (
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
  state,
  commandUtils,
}: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { currentStepIndex, totalStepCount } = state.steps
  const {
    errorMessage,
    showExitConfirmation,
    isExiting,
    confirmExitLPC,
  } = commandUtils

  return (
    <WizardHeader
      title={t('labware_position_check_title')}
      currentStep={errorMessage != null ? undefined : currentStepIndex + 1}
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
  const { current: currentStep } = props.state.steps
  const {
    isExiting,
    isRobotMoving,
    errorMessage,
    showExitConfirmation,
  } = props.commandUtils

  // TODO(jh, 01-14-25): Handle open door behavior.

  // Handle special cases that are shared by multiple steps first.
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
  switch (currentStep.section) {
    case NAV_STEPS.BEFORE_BEGINNING:
      return <BeforeBeginning step={currentStep} {...props} />

    case NAV_STEPS.CHECK_POSITIONS:
      return <CheckItem step={currentStep} {...props} />

    case NAV_STEPS.ATTACH_PROBE:
      return <AttachProbe step={currentStep} {...props} />

    case NAV_STEPS.DETACH_PROBE:
      return <DetachProbe step={currentStep} {...props} />

    case NAV_STEPS.RESULTS_SUMMARY:
      return <ResultsSummary step={currentStep} {...props} />

    default:
      console.error('Unhandled LPC step.')
      return <BeforeBeginning step={currentStep} {...props} />
  }
}
