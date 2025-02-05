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
      steps.map(step => step.step)
    )
  ) {
    throw new Error('One or more steps are unrecognized.')
  }

  // evaluate each step and execute the appropriate function

  steps.forEach(step => {
    if (isEnumValue([SetupActions], step.step)) {
      executeSetupSteps(step)
    } else if (isEnumValue([SetupVerifications], step)) {
      executeVerificationStep(step)
    } else if (isEnumValue([UniversalActions], step)) {
      executeUniversalAction(step)
    } else if (isEnumValue([ModActions], step)) {
      executeModSteps(step)
    } else if (isEnumValue([ModVerifications], step)) {
      executeVerifyModStep(step)
    }
  })
}
