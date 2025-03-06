import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type {
  HostConfig,
  LabwareOffsetLocationSequenceComponent,
} from '../types'
import type { StoredLabwareOffset, MultiBodyMeta } from './types'

export interface LabwareOffsetsSearchParams {
  /** Filters are ORed together. Within a single filter, criteria are ANDed together. */
  filters?: Array<{
    id?: string
    definitionUri?: string
    locationSequence?: LabwareOffsetLocationSequenceComponent[]
    mostRecentOnly?: boolean
  }>
  cursor?: number
  pageLength?: number | 'unlimited'
}

export interface LabwareOffsetsResponse {
  data: StoredLabwareOffset[]
  meta: MultiBodyMeta
}

/**
 * Get a filtered list of all the labware offsets currently stored on the robot.
 * Results are returned in order from oldest to newest.
 *
 * @param params - Optional filter parameters.
 */
export function getLabwareOffsets(
  config: HostConfig,
  params: LabwareOffsetsSearchParams = {}
): ResponsePromise<LabwareOffsetsResponse> {
  // If we naively give an array to axios's `params`:
  //   {params: {ourArray: [1, 2]}}
  // Then axios will serialize it in the URL like:
  //   ?ourArray[]=1&?ourArray[]=2
  // We don't want that. We want:
  //   ?ourArray=[1,2]
  // So, serialize it to a string ourselves before giving it to axios.
  params.filters satisfies unknown[] | undefined
  const stringifiedFilters = params.filters === undefined ? undefined : JSON.stringify(params.filters)
  const fixedParams = {
    ...params,
    filters: stringifiedFilters
  }

  return request<LabwareOffsetsResponse>(GET, '/labwareOffsets', null, config, fixedParams)
}
