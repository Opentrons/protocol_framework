import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { LPCWizardState } from '/app/organisms/LabwarePositionCheck/redux'
import type { LoadedPipette, PipetteChannels } from '@opentrons/shared-data'

export const selectActivePipette = (
  state: LPCWizardState
): LoadedPipette | undefined => {
  const { protocolData, steps } = state
  const pipetteId = 'pipetteId' in steps.current ? steps.current.pipetteId : ''

  if (pipetteId === '') {
    console.warn(`No matching pipette found for pipetteId ${pipetteId}`)
  }

  return protocolData.pipettes.find(pipette => pipette.id === pipetteId)
}

export const selectActivePipetteChannelCount = (
  state: LPCWizardState
): PipetteChannels => {
  const pipetteName = selectActivePipette(state)?.pipetteName

  return pipetteName != null
    ? getPipetteNameSpecs(pipetteName)?.channels ?? 1
    : 1
}
