import * as StepGeneration from '@opentrons/step-generation'

export const commandCreatorFromStepArgs = (
  args: StepGeneration.CommandCreatorArgs
): StepGeneration.CurriedCommandCreator | null => {
  switch (args.commandCreatorFnName) {
    case 'consolidate': {
      return StepGeneration.curryCommandTopPython(
        StepGeneration.consolidate,
        args
      )
    }

    case 'delay': {
      return StepGeneration.curryCommandTopPython(StepGeneration.delay, args)
    }

    case 'distribute':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.distribute,
        args
      )

    case 'transfer':
      return StepGeneration.curryCommandTopPython(StepGeneration.transfer, args)

    case 'mix':
      return StepGeneration.curryCommandTopPython(StepGeneration.mix, args)

    case 'moveLabware': {
      return StepGeneration.curryCommandTopPython(
        StepGeneration.moveLabware,
        args
      )
    }

    case 'engageMagnet':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.engageMagnet,
        args
      )

    case 'disengageMagnet':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.disengageMagnet,
        args
      )

    case 'setTemperature':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.setTemperature,
        args
      )

    case 'deactivateTemperature':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.deactivateTemperature,
        args
      )

    case 'waitForTemperature':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.waitForTemperature,
        args
      )

    case 'thermocyclerProfile':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.thermocyclerProfileStep,
        args
      )

    case 'thermocyclerState':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.thermocyclerStateStep,
        args
      )
    case 'heaterShaker':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.heaterShaker,
        args
      )
    case 'comment':
      return StepGeneration.curryCommandTopPython(StepGeneration.comment, args)
    case 'absorbanceReaderOpenLid':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.absorbanceReaderOpenLid,
        args
      )
    case 'absorbanceReaderCloseLid':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.absorbanceReaderCloseLid,
        args
      )
    case 'absorbanceReaderRead':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.absorbanceReaderCloseRead,
        args
      )
    case 'absorbanceReaderInitialize':
      return StepGeneration.curryCommandTopPython(
        StepGeneration.absorbanceReaderCloseInitialize,
        args
      )
  }
  // @ts-expect-error we've exhausted all command creators, but keeping this console warn
  // for when we impelement the next command creator
  console.warn(`unhandled commandCreatorFnName: ${args.commandCreatorFnName}`)
  return null
}
