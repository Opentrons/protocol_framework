import type { MoveToAddressableAreaCreateCommand } from '@opentrons/shared-data'
import type { CommandCreatorResult } from '@opentrons/step-generation'

/**
 * finds and returns last moveToAddressableArea command if it exists
 * @param {CommandCreatorResult} frame next frame from command creator
 * @returns {MoveToAddressableAreaCreateCommand | null} previous moveToAddressableArea command
 */
export const getPreviousMoveToAddressableAreaCommand = (
  frame: CommandCreatorResult
): MoveToAddressableAreaCreateCommand | null => {
  if ('commands' in frame) {
    for (let i = frame.commands.length - 1; i >= 0; i--) {
      const command = frame.commands[i]
      if (command.commandType === 'moveToAddressableArea') {
        return command
      }
    }
  }
  return null
}
