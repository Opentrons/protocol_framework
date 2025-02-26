import { describe, expect, it } from 'vitest'
import { getPreviousMoveToAddressableAreaCommand } from '../utils/getPreviousMoveToAddressableAreaCommand'
import type {
  CreateCommand,
  MoveToAddressableAreaCreateCommand,
} from '@opentrons/shared-data'

const PIPETTE_ID = 'mockPipetteId'
const DUMMY_COMMANDS = [
  {} as CreateCommand,
  {} as CreateCommand,
  {} as CreateCommand,
  {} as CreateCommand,
]
const MOVE_TO_TRASH_BIN_COMMAND: MoveToAddressableAreaCreateCommand = {
  commandType: 'moveToAddressableArea',
  params: {
    pipetteId: PIPETTE_ID,
    addressableAreaName: 'movableTrashD1',
    offset: { x: 0, y: 0, z: 0 },
  },
}
const MOVE_TO_WASTE_CHUTE_COMMAND: MoveToAddressableAreaCreateCommand = {
  commandType: 'moveToAddressableArea',
  params: {
    pipetteId: PIPETTE_ID,
    addressableAreaName: '8ChannelWasteChute',
    offset: { x: 0, y: 0, z: 0 },
  },
}
const BASE_COMMANDS: CreateCommand[] = [
  ...DUMMY_COMMANDS,
  {
    commandType: 'aspirateInPlace',
    params: { pipetteId: PIPETTE_ID, volume: 10, flowRate: 100 },
  },
]

describe('getPreviousMoveToAddressableAreaCommand', () => {
  it('returns moveToAddressableAreaCommand if one previous exists', () => {
    const frame = {
      commands: [MOVE_TO_TRASH_BIN_COMMAND, ...BASE_COMMANDS],
    }
    expect(getPreviousMoveToAddressableAreaCommand(frame)).toEqual({
      commandType: 'moveToAddressableArea',
      params: {
        pipetteId: PIPETTE_ID,
        addressableAreaName: 'movableTrashD1',
        offset: { x: 0, y: 0, z: 0 },
      },
    })
  })

  it('returns closest previous moveToAddressableAreaCommand if multiple exist', () => {
    const frame = {
      commands: [
        MOVE_TO_TRASH_BIN_COMMAND,
        MOVE_TO_WASTE_CHUTE_COMMAND,
        ...BASE_COMMANDS,
      ],
    }
    expect(getPreviousMoveToAddressableAreaCommand(frame)).toEqual({
      commandType: 'moveToAddressableArea',
      params: {
        pipetteId: PIPETTE_ID,
        addressableAreaName: '8ChannelWasteChute',
        offset: { x: 0, y: 0, z: 0 },
      },
    })
  })
  it('returns null if no previous moveToAddressableAreaCommand exists', () => {
    const frame = {
      commands: BASE_COMMANDS,
    }
    expect(getPreviousMoveToAddressableAreaCommand(frame)).toEqual(null)
  })
})
