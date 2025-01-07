import type { CreateCommand, LoadedPipette } from '@opentrons/shared-data'
import type { UseLPCCommandWithChainRunChildProps } from './types'
import { useState } from 'react'

export interface UseProbeCommandsResult {
  moveToMaintenancePosition: (pipette: LoadedPipette | undefined) => void
  createProbeAttachmentHandler: (
    pipetteId: string,
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ) => () => Promise<void>
  createProbeDetachmentHandler: (
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ) => () => Promise<void>
  unableToDetect: boolean
  setShowUnableToDetect: (canDetect: boolean) => void
}

export function useHandleProbeCommands({
  chainLPCCommands,
}: UseLPCCommandWithChainRunChildProps): UseProbeCommandsResult {
  const [showUnableToDetect, setShowUnableToDetect] = useState<boolean>(false)

  const moveToMaintenancePosition = (
    pipette: LoadedPipette | undefined
  ): void => {
    const pipetteMount = pipette?.mount

    void chainLPCCommands(
      [
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: pipetteMount ?? 'left',
          },
        },
      ],
      false
    )
  }

  const createProbeAttachmentHandler = (
    pipetteId: string,
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ): (() => Promise<void>) => {
    const pipetteMount = pipette?.mount
    const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
      pipetteMount === 'left' ? 'leftZ' : 'rightZ'

    const verifyCommands: CreateCommand[] = [
      {
        commandType: 'verifyTipPresence',
        params: {
          pipetteId,
          expectedState: 'present',
          followSingularSensor: 'primary',
        },
      },
    ]
    const homeCommands: CreateCommand[] = [
      { commandType: 'home', params: { axes: [pipetteZMotorAxis] } },
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

    return () =>
      chainLPCCommands(verifyCommands, false)
        .then(() => chainLPCCommands(homeCommands, false))
        .then(() => {
          onSuccess()
        })
        .catch(() => {
          setShowUnableToDetect(true)

          // Stop propagation to prevent error screen routing.
          return Promise.resolve()
        })
  }

  const createProbeDetachmentHandler = (
    pipette: LoadedPipette | undefined,
    onSuccess: () => void
  ): (() => Promise<void>) => {
    const pipetteMount = pipette?.mount
    const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
      pipetteMount === 'left' ? 'leftZ' : 'rightZ'

    return () =>
      chainLPCCommands(
        [
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
        ],
        false
      ).then(() => {
        onSuccess()
      })
  }

  return {
    moveToMaintenancePosition,
    createProbeAttachmentHandler,
    unableToDetect: showUnableToDetect,
    setShowUnableToDetect,
    createProbeDetachmentHandler,
  }
}
