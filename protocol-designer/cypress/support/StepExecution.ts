import { executeUniversalAction, UniversalActions } from './universalActions'
import { isEnumValue } from './utils'
import '../support/commands'
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
import {
  MixActions,
  MixVerifications,
  executeMixAction,
  executeVerifyMixStep
} from './mixSetting'

export type StepsList = Array<
  | SetupActions
  | SetupVerifications
  | UniversalActions
  | ModActions
  | ModVerifications
  | MixActions
  | MixVerifications
>

export const runSteps = (steps: StepsList): void => {
  const enumsToCheck = [
    SetupActions,
    ModActions,
    ModVerifications,
    SetupVerifications,
    UniversalActions,
    MixActions,
    MixVerifications
  ]

  if (!isEnumValue(enumsToCheck, steps)) {
    throw new Error('One or more steps are unrecognized.')
  }

  steps.forEach(step => {
    if (isEnumValue([SetupActions], step)) {
      executeSetupSteps(step as SetupActions)
    } else if (isEnumValue([SetupVerifications], step)) {
      executeVerificationStep(step as SetupVerifications)
    } else if (isEnumValue([UniversalActions], step)) {
      executeUniversalAction(step as UniversalActions)
    } else if (isEnumValue([ModActions], step)) {
      executeModSteps(step as ModActions)
    } else if (isEnumValue([ModVerifications], step)) {
      executeVerifyModStep(step as ModVerifications)
    } else if (isEnumValue([MixActions], step)) {
      executeMixAction(step as MixActions)
    } else if (isEnumValue([MixVerifications], step)) {
      executeVerifyMixStep(step as MixVerifications)
   }
  })
}
