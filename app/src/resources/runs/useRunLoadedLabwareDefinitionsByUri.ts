import { useMemo } from 'react'

import { useRunLoadedLabwareDefinitions } from '@opentrons/react-api-client'
import { getLabwareDefURI } from '@opentrons/shared-data'

import type { UseQueryOptions } from 'react-query'
import type { AxiosError } from 'axios'
import type {
  HostConfig,
  RunLoadedLabwareDefinitions,
} from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type RunLoadedLabwareDefinitionsByUri = Record<
  string,
  LabwareDefinition2
>

// Returns a record of labware definitions keyed by URI for the labware that
// has been loaded with a "loadLabware" command. Errors if the run is not the current run.
export function useRunLoadedLabwareDefinitionsByUri(
  runId: string | null,
  options: UseQueryOptions<RunLoadedLabwareDefinitions, AxiosError> = {},
  hostOverride?: HostConfig
): RunLoadedLabwareDefinitionsByUri {
  const { data } = useRunLoadedLabwareDefinitions(runId, options, hostOverride)

  return useMemo(() => {
    const result: Record<string, LabwareDefinition2> = {}
    // @ts-expect-error TODO(jh, 10-12-24): Update the app's typing to support LabwareDefinition3.
    data?.data.forEach((def: LabwareDefinition2) => {
      if ('schemaVersion' in def) {
        const lwUri = getLabwareDefURI(def)
        result[lwUri] = def
      }
    })

    return result
  }, [data])
}
