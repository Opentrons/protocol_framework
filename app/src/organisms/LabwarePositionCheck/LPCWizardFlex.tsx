import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { useConditionalConfirm, ModalShell } from '@opentrons/components'
import {
  useCreateLabwareOffsetMutation,
  useCreateMaintenanceCommandMutation,
} from '@opentrons/react-api-client'
import { FIXED_TRASH_ID, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
// import { useTrackEvent } from '/app/redux/analytics'
import { BeforeBeginning } from './BeforeBeginning'
import { ExitConfirmation } from './ExitConfirmation'
import { CheckItem } from './CheckItem'
import { WizardHeader } from '/app/molecules/WizardHeader'
import { getIsOnDevice } from '/app/redux/config'
import { AttachProbe } from './AttachProbe'
import { DetachProbe } from './DetachProbe'
import { PickUpTip } from './PickUpTip'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'
import { FatalError } from './FatalErrorModal'
import { RobotMotionLoader } from './RobotMotionLoader'
import { useChainMaintenanceCommands } from '/app/resources/maintenance_runs'
import { getLabwarePositionCheckSteps } from './getLabwarePositionCheckSteps'
import { useLPCInitialState } from '/app/organisms/LabwarePositionCheck/hooks'
import { useLPCReducer } from '/app/organisms/LabwarePositionCheck/redux'

import type {
  Coordinates,
  CreateCommand,
  DropTipCreateCommand,
} from '@opentrons/shared-data'
import type {
  LabwareOffsetCreateData,
  CommandData,
} from '@opentrons/api-client'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { LPCFlowsProps } from '/app/organisms/LabwarePositionCheck/LPCFlows'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import { NAV_STEPS } from '/app/organisms/LabwarePositionCheck/constants'

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds

export function LPCWizardFlex(props: LPCFlowsProps): JSX.Element {
  const {
    mostRecentAnalysis,
    robotType,
    runId,
    onCloseClick,
    protocolName,
    maintenanceRunId,
  } = props
  const isOnDevice = useSelector(getIsOnDevice)
  const protocolData = mostRecentAnalysis
  const shouldUseMetalProbe = robotType === FLEX_ROBOT_TYPE

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
    const dropTipToBeSafeCommands: DropTipCreateCommand[] = shouldUseMetalProbe
      ? []
      : (protocolData?.pipettes ?? []).map(pip => ({
          commandType: 'dropTip' as const,
          params: {
            pipetteId: pip.id,
            labwareId: FIXED_TRASH_ID,
            wellName: 'A1',
            wellLocation: { origin: 'default' as const },
          },
        }))
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
        ...dropTipToBeSafeCommands,
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
  const LPCSteps = getLabwarePositionCheckSteps(
    protocolData,
    shouldUseMetalProbe
  )
  const totalStepCount = LPCSteps.length - 1
  const currentStep = LPCSteps?.[currentStepIndex]

  const protocolHasModules = protocolData.modules.length > 0

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
      protocolData={protocolData}
      protocolName={protocolName}
      proceed={proceed}
      dispatch={dispatch}
      state={state}
      shouldUseMetalProbe={true}
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
    case NAV_STEPS.CHECK_TIP_RACKS:
    case NAV_STEPS.CHECK_LABWARE:
      return <CheckItem {...restProps} step={step} />

    case NAV_STEPS.ATTACH_PROBE:
      return <AttachProbe {...restProps} step={step} />

    case NAV_STEPS.DETACH_PROBE:
      return <DetachProbe {...restProps} step={step} />

    case NAV_STEPS.PICK_UP_TIP:
      return <PickUpTip {...restProps} step={step} />

    case NAV_STEPS.RETURN_TIP:
      return <ReturnTip {...restProps} step={step} />

    case NAV_STEPS.RESULTS_SUMMARY:
      return <ResultsSummary {...restProps} step={step} />

    default:
      console.error('Unhandled LPC step.')
      return <BeforeBeginning {...restProps} step={step} />
  }
}
