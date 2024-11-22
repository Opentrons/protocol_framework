import { useMutation } from 'react-query'

import { updateErrorRecoveryPolicy } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutationOptions,
  UseMutationResult,
  UseMutateFunction,
} from 'react-query'
import type { AxiosError } from 'axios'
import type {
  RecoveryPolicyRulesParams,
  ErrorRecoveryPolicyResponse,
  HostConfig,
} from '@opentrons/api-client'

export type UseErrorRecoveryPolicyResponse = UseMutationResult<
  ErrorRecoveryPolicyResponse,
  AxiosError,
  RecoveryPolicyRulesParams
> & {
  updateErrorRecoveryPolicy: UseMutateFunction<
    ErrorRecoveryPolicyResponse,
    AxiosError,
    RecoveryPolicyRulesParams
  >
}

export type UseUpdateErrorRecoveryPolicyOptions = UseMutationOptions<
  ErrorRecoveryPolicyResponse,
  AxiosError,
  RecoveryPolicyRulesParams
>

export function useUpdateErrorRecoveryPolicy(
  runId: string,
  options: UseUpdateErrorRecoveryPolicyOptions = {}
): UseErrorRecoveryPolicyResponse {
  const host = useHost()

  const mutation = useMutation<
    ErrorRecoveryPolicyResponse,
    AxiosError,
    RecoveryPolicyRulesParams
  >(
    [host, 'runs', runId, 'errorRecoveryPolicy'],
    (policyRules: RecoveryPolicyRulesParams) =>
      updateErrorRecoveryPolicy(host as HostConfig, runId, policyRules)
        .then(response => response.data)
        .catch(e => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    updateErrorRecoveryPolicy: mutation.mutate,
  }
}
