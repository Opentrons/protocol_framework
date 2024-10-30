import { describe, it, expect } from 'vitest'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { getXPosition } from '../utils'

describe('getXPosition', () => {
  it('should return the right position 600 for FLEX robot type and slot 3', () => {
    expect(getXPosition('3', FLEX_ROBOT_TYPE, false)).toBe('600')
  })

  it('should return the right position 700 for FLEX robot type and slot 4', () => {
    expect(getXPosition('4', FLEX_ROBOT_TYPE, true)).toBe('700')
  })

  it('should return the left position for FLEX robot type and slot 1', () => {
    expect(getXPosition('1', FLEX_ROBOT_TYPE, false)).toBe('-400')
  })

  it('should return the right position for OT2 robot type and slot 6', () => {
    expect(getXPosition('6', OT2_ROBOT_TYPE, false)).toBe('500')
  })

  it('should return the left position for OT2 robot type and slot 2', () => {
    expect(getXPosition('2', OT2_ROBOT_TYPE, false)).toBe('-300')
  })
})
