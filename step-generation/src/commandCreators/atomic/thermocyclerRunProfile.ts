import { uuid } from '../../utils'
import type { TCProfileParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'
export const thermocyclerRunProfile: CommandCreator<TCProfileParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId, profile, blockMaxVolumeUl } = args
  return {
    commands: [
      {
        commandType: 'thermocycler/runProfile',
        key: uuid(),
        params: {
          moduleId,
          profile: profile.map(profileItem => ({
            holdSeconds: profileItem.holdSeconds,
            celsius: profileItem.celsius,
          })),
          blockMaxVolumeUl,
        },
      },
    ],
  }
}
