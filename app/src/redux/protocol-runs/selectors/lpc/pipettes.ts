import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { LoadedPipette, PipetteChannels } from '@opentrons/shared-data'

// TODO(jh, 01-16-25): Revisit once LPC `step` refactors are completed.
// eslint-disable-next-line opentrons/no-imports-across-applications
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'
import type { State } from '../../../types'

export const selectActivePipette = (
  step: LabwarePositionCheckStep,
  runId: string,
  state: State
): LoadedPipette | null => {
  const { protocolData } = state.protocolRuns[runId]?.lpc ?? {}
  const pipetteId = 'pipetteId' in step ? step.pipetteId : ''

  if (pipetteId === '') {
    console.warn(`No matching pipette found for pipetteId ${pipetteId}`)
  } else if (protocolData == null) {
    console.warn('LPC state not initalized before selector use.')
  }

  return (
    protocolData?.pipettes.find(pipette => pipette.id === pipetteId) ?? null
  )
}

export const selectActivePipetteChannelCount = (
  step: LabwarePositionCheckStep,
  runId: string,
  state: State
): PipetteChannels => {
  const pipetteName = selectActivePipette(step, runId, state)?.pipetteName

  return pipetteName != null
    ? getPipetteNameSpecs(pipetteName)?.channels ?? 1
    : 1
}
