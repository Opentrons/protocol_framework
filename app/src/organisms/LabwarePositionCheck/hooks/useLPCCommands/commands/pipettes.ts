import { fullHomeCommands } from './gantry'
import { selectActivePipette } from '/app/organisms/LabwarePositionCheck/redux'

import type {
  CreateCommand,
  LoadedPipette,
  MotorAxes,
} from '@opentrons/shared-data'
import type {
  CheckPositionsStep,
  LabwarePositionCheckStep,
} from '/app/organisms/LabwarePositionCheck/types'
import type { Axis, Sign, StepSize } from '/app/molecules/JogControls/types'
import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'

const PROBE_LENGTH_MM = 44.5

export const savePositionCommands = (pipetteId: string): CreateCommand[] => [
  { commandType: 'savePosition', params: { pipetteId } },
]

export const moveToWellCommands = (
  step: CheckPositionsStep
): CreateCommand[] => {
  const { pipetteId, labwareId } = step

  return [
    {
      commandType: 'moveToWell' as const,
      params: {
        pipetteId,
        labwareId,
        wellName: 'A1',
        wellLocation: {
          origin: 'top' as const,
          offset: { x: 0, y: 0, z: PROBE_LENGTH_MM },
        },
      },
    },
  ]
}

export const retractSafelyAndHomeCommands = (): CreateCommand[] => [
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
  ...fullHomeCommands(),
]

export const retractPipetteAxesSequentiallyCommands = (
  pipette: LoadedPipette | undefined
): CreateCommand[] => {
  const pipetteZMotorAxis = pipette?.mount === 'left' ? 'leftZ' : 'rightZ'

  return [
    {
      commandType: 'retractAxis' as const,
      params: {
        axis: pipetteZMotorAxis,
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
  ]
}

export interface MoveRelativeCommandParams {
  pipetteId: string
  axis: Axis
  dir: Sign
  step: StepSize
}

export const moveRelativeCommand = ({
  pipetteId,
  axis,
  dir,
  step,
}: MoveRelativeCommandParams): CreateCommand => ({
  commandType: 'moveRelative',
  params: { pipetteId, distance: step * dir, axis },
})

export const moveToMaintenancePosition = (
  step: LabwarePositionCheckStep,
  state: LPCWizardState
): CreateCommand[] => {
  const pipette = selectActivePipette(step, state)
  const pipetteMount = pipette?.mount

  return [
    {
      commandType: 'calibration/moveToMaintenancePosition' as const,
      params: {
        mount: pipetteMount ?? 'left',
      },
    },
  ]
}

export const verifyProbeAttachmentAndHomeCommands = (
  pipetteId: string,
  pipette: LoadedPipette | undefined
): CreateCommand[] => {
  const pipetteMount = pipette?.mount
  const pipetteZMotorAxis = pipetteMount === 'left' ? 'leftZ' : 'rightZ'

  return [
    {
      commandType: 'verifyTipPresence',
      params: {
        pipetteId,
        expectedState: 'present',
        followSingularSensor: 'primary',
      },
    },
    homeSelectAxesSequentiallyCommand([pipetteZMotorAxis, 'x', 'y']),
  ]
}

const homeSelectAxesSequentiallyCommand = (axes: MotorAxes): CreateCommand => ({
  commandType: 'home',
  params: { axes },
})
