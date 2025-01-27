import { getPipetteNameSpecs } from '@opentrons/shared-data'

import type { LoadedPipette } from '@opentrons/shared-data'

// TOME TODO: Actually handle this throwing an error.

// Return the pipetteId for the pipette in the protocol with the highest channel count.
export function getActivePipetteId(pipettes: LoadedPipette[]): string {
  if (pipettes.length < 1) {
    throw new Error(
      'no pipettes in protocol, cannot determine primary pipette for LPC'
    )
  }

  return pipettes.reduce((acc, pip) => {
    return (getPipetteNameSpecs(acc.pipetteName)?.channels ?? 0) >
      (getPipetteNameSpecs(pip.pipetteName)?.channels ?? 0)
      ? pip
      : acc
  }, pipettes[0]).id
}
