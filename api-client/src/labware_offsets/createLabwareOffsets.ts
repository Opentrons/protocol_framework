import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  LabwareOffsetLocationSequenceComponent,
  StoredLabwareOffset,
} from './types'
import type { VectorOffset } from '../runs'

export interface StoredLabwareOffsetCreate {
  definitionUri: string
  locationSequence: Array<
    Omit<LabwareOffsetLocationSequenceComponent, 'kind' | 'unknown'>
  >
  vector: VectorOffset
}

export type CreateLabwareOffsetData =
  | StoredLabwareOffsetCreate
  | StoredLabwareOffsetCreate[]

export interface CreateLabwareOffsetResponse {
  data: StoredLabwareOffset | StoredLabwareOffset[]
}

/**
 * Store labware offsets for later retrieval.
 *
 * @param data - The labware offset(s) to create. Can be a single offset or an array of offsets.
 * @returns The created labware offset(s). Will return a single object or an array depending on the input format.
 */
export function createLabwareOffsets(
  config: HostConfig,
  data: CreateLabwareOffsetData
): ResponsePromise<CreateLabwareOffsetResponse> {
  return request<
    CreateLabwareOffsetResponse,
    { data: CreateLabwareOffsetData }
  >(POST, '/labwareOffsets', { data }, config)
}
