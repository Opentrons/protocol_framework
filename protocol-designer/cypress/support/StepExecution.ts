import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue, isFunctionInRecord } from './utils'
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  SetupActions,
  SetupVerifications,
  executeVerificationStep,
  executeSetupSteps,
  SetupFunctionMap,
  setupFunctions,
} from './SetupSteps'
import {
  ModActions,
  ModVerifications,
  executeModSteps,
  executeVerifyModStep,
} from './SupportModules'

export interface EnumBasedStep {
  type: 'enum'
  step:
    | SetupActions
    | SetupVerifications
    | UniversalActions
    | ModActions
    | ModVerifications
  params?: string | string[] | number | boolean
}

export interface FunctionBasedStep {
  type: 'function'

  step: SetupFunctionMap['name']
  // add other support modules function maps here

  // This is optional because we want to allow functions that don't take any parameters
  params?: SetupFunctionMap['param']
  // add other support modules function maps here
}

export type StepListItem = FunctionBasedStep | EnumBasedStep
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
      (item.type === 'enum' && isEnumValue([SetupActions], item.step)) ||
      (item.type === 'function' && isFunctionInRecord(setupFunctions, item.step))
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
