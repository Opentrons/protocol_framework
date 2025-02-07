import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  SetupActions,
  SetupVerifications,
  executeVerificationStep,
  executeSetupSteps,
  SetupFunction,
} from './SetupSteps'
import {
  ModActions,
  ModVerifications,
  executeModSteps,
  executeVerifyModStep,
} from './SupportModules'

export interface StepListItem {
  step:
    | SetupActions
    | SetupVerifications
    | UniversalActions
    | ModActions
    | ModVerifications
    | SetupFunction
  params?: string | string[] | number | boolean | undefined
}

export type StepsList = StepListItem[]

export const runSteps = (steps: StepsList): void => {
  const enumsToCheck = [
    SetupActions,
    ModActions,
    ModVerifications,
    SetupVerifications,
    UniversalActions,
  ]

  if (
    !isEnumValue(
      enumsToCheck,
      steps
        .filter(item => typeof item.step !== 'function')
        .map(item => item.step)
    )
  ) {
    throw new Error('One or more steps are unrecognized.')
  }

  steps.forEach(item => {
    if (
      isEnumValue([SetupActions], item.step) ||
      typeof item.step === 'function'
    ) {
      executeSetupSteps(item)
    } else if (isEnumValue([SetupVerifications], item.step)) {
      executeVerificationStep(item)
    } else if (isEnumValue([UniversalActions], item.step)) {
      executeUniversalAction(item)
    } else if (isEnumValue([ModActions], item.step)) {
      executeModSteps(item)
    } else if (isEnumValue([ModVerifications], item.step)) {
      executeVerifyModStep(item)
    }
  })
}
