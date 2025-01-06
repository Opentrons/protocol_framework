import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { useConditionalConfirm, ModalShell } from '@opentrons/components'
import {
  useCreateLabwareOffsetMutation,
  useCreateMaintenanceCommandMutation,
} from '@opentrons/react-api-client'

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
import { FatalError } from './FatalErrorModal'
import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'
import { getLabwarePositionCheckSteps } from './getLabwarePositionCheckSteps'
import { useLPCInitialState } from '/app/organisms/LabwarePositionCheck/hooks'
import { useLPCReducer } from '/app/organisms/LabwarePositionCheck/redux'

import type { Coordinates, CreateCommand } from '@opentrons/shared-data'
import type {
  LabwareOffsetCreateData,
  CommandData,
} from '@opentrons/api-client'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds

export function LPCWizardFlex(
  props: Omit<LPCFlowsProps, 'robotType'>
): JSX.Element {
  const {
    mostRecentAnalysis,
    runId,
    onCloseClick,
    protocolName,
    maintenanceRunId,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isApplyingOffsets, setIsApplyingOffsets] = useState<boolean>(false)

  // TOME TODO: Like with ER, separate wizard and content. The wizard injects the data layer to the content layer.

  const initialState = useLPCInitialState()
  const { state, dispatch } = useLPCReducer(initialState)

  const [isExiting, setIsExiting] = useState(false)
  const {
    createMaintenanceCommand: createSilentCommand,
  } = useCreateMaintenanceCommandMutation()
  const {
    chainRunCommands,
    isCommandMutationLoading: isCommandChainLoading,
  } = useChainMaintenanceCommands()

  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)

    chainRunCommands(
      maintenanceRunId,
      [
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: 'leftZ',
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: 'rightZ',
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'x' },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'y' },
        },
        { commandType: 'home' as const, params: {} },
      ],
      true
    )
      .then(() => {
        props.onCloseClick()
      })
      .catch(() => {
        props.onCloseClick()
      })
  }
  const {
    confirm: confirmExitLPC,
    showConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const proceed = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== LPCSteps.length - 1
        ? currentStepIndex + 1
        : currentStepIndex
    )
  }
  const LPCSteps = getLabwarePositionCheckSteps(mostRecentAnalysis)
  const totalStepCount = LPCSteps.length - 1
  const currentStep = LPCSteps?.[currentStepIndex]

  const protocolHasModules = mostRecentAnalysis.modules.length > 0

  const handleJog = (
    axis: Axis,
    dir: Sign,
    step: StepSize,
    onSuccess?: (position: Coordinates | null) => void
  ): void => {
    const pipetteId = 'pipetteId' in currentStep ? currentStep.pipetteId : null
    if (pipetteId != null) {
      createSilentCommand({
        maintenanceRunId,
        command: {
          commandType: 'moveRelative',
          params: { pipetteId, distance: step * dir, axis },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT,
      })
        .then(data => {
          onSuccess?.(
            (data?.data?.result?.position ?? null) as Coordinates | null
          )
        })
        .catch((e: Error) => {
          setErrorMessage(`error issuing jog command: ${e.message}`)
        })
    } else {
      setErrorMessage(
        `could not find pipette to jog with id: ${pipetteId ?? ''}`
      )
    }
  }
  const chainMaintenanceRunCommands = (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ): Promise<CommandData[]> =>
    chainRunCommands(maintenanceRunId, commands, continuePastCommandFailure)

  const handleApplyOffsets = (offsets: LabwareOffsetCreateData[]): void => {
    setIsApplyingOffsets(true)
    Promise.all(offsets.map(data => createLabwareOffset({ runId, data })))
      .then(() => {
        onCloseClick()
      })
      .catch((e: Error) => {
        setErrorMessage(`error applying labware offsets: ${e.message}`)
      })
  }

  return (
    <LPCWizardFlexComponent
      {...props}
      step={currentStep}
      protocolData={mostRecentAnalysis}
      protocolName={protocolName}
      proceed={proceed}
      dispatch={dispatch}
      state={state}
      currentStepIndex={currentStepIndex}
      totalStepCount={totalStepCount}
      showConfirmation={showConfirmation}
      isExiting={isExiting}
      confirmExitLPC={confirmExitLPC}
      cancelExitLPC={cancelExitLPC}
      chainRunCommands={chainMaintenanceRunCommands}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
      handleJog={handleJog}
      handleApplyOffsets={handleApplyOffsets}
      isApplyingOffsets={isApplyingOffsets}
      isRobotMoving={isCommandChainLoading}
      isOnDevice={isOnDevice}
      protocolHasModules={protocolHasModules}
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
  errorMessage,
  currentStepIndex,
  totalStepCount,
  showConfirmation,
  isExiting,
  confirmExitLPC,
}: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')

  return (
    <WizardHeader
      title={t('labware_position_check_title')}
      currentStep={errorMessage != null ? undefined : currentStepIndex}
      totalSteps={errorMessage != null ? undefined : totalStepCount}
      onExit={
        showConfirmation || isExiting || errorMessage != null
          ? undefined
          : confirmExitLPC
      }
    />
  )
}

function LPCWizardContent(props: LPCWizardContentProps): JSX.Element {
  const { step, ...restProps } = props
  const { t } = useTranslation('shared')

  // Handle special cases first.
  if (props.isExiting) {
    return <RobotMotionLoader header={t('stand_back_robot_is_in_motion')} />
  }
  if (props.errorMessage != null) {
    return <FatalError {...props} />
  }
  if (props.showConfirmation) {
    return <ExitConfirmation {...props} />
  }

  // Handle step-based routing.
  switch (step.section) {
    case NAV_STEPS.BEFORE_BEGINNING:
      return <BeforeBeginning {...restProps} step={step} />

    case NAV_STEPS.CHECK_POSITIONS:
      return <CheckItem {...restProps} step={step} />

    case NAV_STEPS.ATTACH_PROBE:
      return <AttachProbe {...restProps} step={step} />

    case NAV_STEPS.DETACH_PROBE:
      return <DetachProbe {...restProps} step={step} />

    case NAV_STEPS.RESULTS_SUMMARY:
      return <ResultsSummary {...restProps} step={step} />

    default:
      console.error('Unhandled LPC step.')
      return <BeforeBeginning {...restProps} step={step} />
  }
}
