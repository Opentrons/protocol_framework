import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'

import { getUniqueLabwareLocationComboInfo } from './utils'

import type { LabwareOffset } from '@opentrons/api-client'
import type { LPCLabwareInfo } from '/app/redux/protocol-runs'
import type { GetUniqueLocationComboInfoParams } from './utils'
import type { LabwareLocationCombo } from '/app/organisms/LegacyApplyHistoricOffsets/hooks/getLabwareLocationCombos'

type UseLPCLabwareInfoProps = GetUniqueLocationComboInfoParams & {
  currentOffsets: LabwareOffset[]
}
// TODO(jh, 01-22-25): This interface will change substantially the switch to /labwareOffsets.

// Structures LPC-able labware info for injection into LPC flows.
export function useLPCLabwareInfo({
  currentOffsets,
  labwareDefs,
  protocolData,
}: UseLPCLabwareInfoProps): LPCLabwareInfo {
  const lwURIs = getLabwareURIsFromAnalysis(protocolData)
  const lwLocationCombos = useMemo(
    () =>
      getUniqueLabwareLocationComboInfo({
        labwareDefs,
        protocolData,
      }),
    [labwareDefs != null, protocolData != null]
  )

  return useMemo(
    () => getLPCLabwareInfoFrom(lwURIs, currentOffsets, lwLocationCombos),
    [lwURIs.length, currentOffsets.length, lwLocationCombos.length]
  )
}

export function getLabwareURIsFromAnalysis(
  analysis: UseLPCLabwareInfoProps['protocolData']
): string[] {
  return analysis?.labware.map(lwInfo => lwInfo.definitionUri) ?? []
}

// NOTE: This is largely a temporary adapter that resolves the app's current way of getting offset data (scraping the run record)
// and the end goal of treating labware as first class citizens. Most of this code will be replaced
// once the app implements the new /labwareOffsets HTTP API.
export function getLPCLabwareInfoFrom(
  lwURIs: string[],
  currentOffsets: LabwareOffset[],
  lwLocationCombos: LabwareLocationCombo[]
): LPCLabwareInfo {
  return Object.fromEntries(
    currentOffsets
      .filter(offset => lwURIs.includes(offset.definitionUri))
      .map(offsetInfo => {
        const {
          id: offsetId,
          definitionUri,
          location,
          ...restInfo
        } = offsetInfo

        const { moduleId, labwareId, adapterId } = getMatchingLocationCombo(
          lwLocationCombos,
          offsetInfo
        ) ?? {
          labwareId: '',
        }

        return [
          offsetId,
          {
            existingOffset: { ...restInfo },
            workingOffset: null,
            locationDetails: {
              ...location,
              labwareId,
              moduleId,
              adapterId,
              definitionUri,
            },
          },
        ]
      })
  )
}

// Get the location combo that matches the info provided from a LabwareOffset.
export function getMatchingLocationCombo(
  combos: LabwareLocationCombo[],
  offsetInfo: LabwareOffset
): LabwareLocationCombo | null {
  return (
    combos.find(
      combo =>
        combo.definitionUri === offsetInfo.definitionUri &&
        isEqual(combo.location, offsetInfo.location)
    ) ?? null
  )
}
