import { uuid } from '../../utils'
import type {
  WaitForDurationCreateCommand,
  WaitForDurationParams,
  WaitForResumeCreateCommand,
  WaitForResumeParams,
} from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const delay: CommandCreator<
  WaitForResumeParams | WaitForDurationParams
> = (args, invariantContext, prevRobotState) => {
  const { message } = args
  //  delay is deprecated and now is either waitForResume or waitForDuration
  let command: WaitForResumeCreateCommand | WaitForDurationCreateCommand
  if ('seconds' in args) {
    command = {
      commandType: 'waitForDuration',
      key: uuid(),
      params: { seconds: args.seconds, message },
    }
  } else {
    command = {
      commandType: 'waitForResume',
      key: uuid(),
      params: { message },
    }
  }
  return {
    commands: [command],
  }
}
