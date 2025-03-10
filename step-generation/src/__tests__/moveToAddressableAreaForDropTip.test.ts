import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PIPETTE,
  getRobotStateWithTipStandard,
  getSuccessResult,
  makeContext,
} from '../fixtures'
import { moveToAddressableAreaForDropTip } from '../commandCreators/atomic'

const p300SingleId = DEFAULT_PIPETTE

describe('moveToAddressableAreaForDropTip', () => {
  let invariantContext = makeContext()

  it('should call moveToAddressableAreaForDropTip with correct params', () => {
    let robotInitialState = getRobotStateWithTipStandard(invariantContext)
    const mockName = 'movableTrashA3'
    robotInitialState.tipState.pipettes = {
      [p300SingleId]: true,
    }

    const result = moveToAddressableAreaForDropTip(
      { pipetteId: p300SingleId, addressableAreaName: mockName },
      invariantContext,
      robotInitialState
    )
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      {
        commandType: 'moveToAddressableAreaForDropTip',
        key: expect.any(String),
        params: {
          pipetteId: p300SingleId,
          addressableAreaName: mockName,
          offset: { x: 0, y: 0, z: 0 },
          alternateDropLocation: true,
        },
      },
    ])
  })
})
