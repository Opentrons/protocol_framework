import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'
import {
  SetupActions,
  SetupVerifications,
  executeVerificationStep,
  executeSetupSteps,
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
      steps.map(item => item.step)
    )
  ) {
    throw new Error('One or more steps are unrecognized.')
  }

  steps.forEach(item => {
    if (isEnumValue([SetupActions], item.step)) {
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
