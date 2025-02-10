/* eslint-disable @typescript-eslint/consistent-type-imports */
import { universalActionHandlers } from './universalActions'
import { setupStepHandlers, setupVerificationHandlers } from './SetupSteps'
import { modStepHandlers, modVerificationHandlers } from './SupportModules'

export const stepHandlers = {
  ...universalActionHandlers,
  ...setupStepHandlers,
  ...setupVerificationHandlers,
  ...modStepHandlers,
  ...modVerificationHandlers,
} as const

export type StepAction = keyof typeof stepHandlers

type HandlerParam<A extends StepAction> = typeof stepHandlers[A]['paramType']

export interface StepItem<A extends StepAction = StepAction> {
  action: A
  param?: HandlerParam<A>
}

export type StepList = StepItem[]

export class StepListBuilder {
  private readonly steps: StepList = []
  addStep<A extends StepAction>(action: A, param?: HandlerParam<A>): this {
    this.steps.push({ action, param })
    return this
  }

  build(): StepList {
    return this.steps
  }
}

export function runSteps(stepList: StepList): void {
  stepList.forEach(item => {
    const { action, param } = item
    const entry = stepHandlers[action]
    if (param !== undefined) {
      ;(entry.handler as (p: typeof param) => void)(param)
    } else {
      if (entry.handler.length > 0) {
        throw new Error(
          `Step action "${String(
            action
          )}" expects a parameter but none was provided`
        )
      }
      ;(entry.handler as () => void)()
    }
  })
}
