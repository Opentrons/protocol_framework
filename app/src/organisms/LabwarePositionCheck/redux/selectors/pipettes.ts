import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'
import type { LoadedPipette, PipetteChannels } from '@opentrons/shared-data'
import type { LabwarePositionCheckStep } from '/app/organisms/LabwarePositionCheck/types'

export const selectActivePipette = (
  step: LabwarePositionCheckStep,
  state: LPCWizardState
): LoadedPipette | undefined => {
  const { protocolData } = state
  const pipetteId = 'pipetteId' in step ? step.pipetteId : ''

  if (pipetteId === '') {
    console.warn(`No matching pipette found for pipetteId ${pipetteId}`)
  }

  return protocolData.pipettes.find(pipette => pipette.id === pipetteId)
}

export const selectActivePipetteChannelCount = (
  step: LabwarePositionCheckStep,
  state: LPCWizardState
): PipetteChannels => {
  const pipetteName = selectActivePipette(step, state)?.pipetteName

  return pipetteName != null
    ? getPipetteNameSpecs(pipetteName)?.channels ?? 1
    : 1
}
