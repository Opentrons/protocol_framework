import { GET, request } from '../request'

import type { HostConfig } from '../types'
import type { ResponsePromise } from '../request'
import type { ErrorRecoveryPolicyResponse } from './types'

export function getErrorRecoveryPolicy(
  config: HostConfig,
  runId: string
): ResponsePromise<ErrorRecoveryPolicyResponse> {
  return request<ErrorRecoveryPolicyResponse>(
    GET,
    `/get/${runId}/errorRecoveryPolicy`,
    null,
    config
  )
}
