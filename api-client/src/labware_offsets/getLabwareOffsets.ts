import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { StoredLabwareOffset, MultiBodyMeta } from './types'
import type { ModuleModel } from '@opentrons/shared-data'

export interface LabwareOffsetsParams {
  id?: string
  definitionUri?: string
  locationSlotName?: string
  locationModuleModel?: ModuleModel | null
  locationDefinitionUri?: string | null
  cursor?: number
  pageLength?: number | 'unlimited'
}

export interface LabwareOffsetsResponse {
  data: StoredLabwareOffset[]
  meta: MultiBodyMeta
}

/**
 * Get a filtered list of all the labware offsets currently stored on the robot.
 * Filters are ANDed together. Results are returned in order from oldest to newest.
 *
 * @param params - Optional filter parameters.
 */
export function getLabwareOffsets(
  config: HostConfig,
  params: LabwareOffsetsParams = {}
): ResponsePromise<LabwareOffsetsResponse> {
  return request<LabwareOffsetsResponse>(
    GET,
    '/labwareOffsets',
    null,
    config,
    params
  )
}
