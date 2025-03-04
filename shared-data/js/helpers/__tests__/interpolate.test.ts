import { describe, expect, it } from 'vitest'
import { linearInterpolate } from '../linearInterpolate'

describe('linearInterpolate', () => {
  it('returns only value if length of interpolationPoints is 1', () => {
    const result = linearInterpolate(10, [[5, 20]])
    expect(result).toEqual(20)
  })
  it('returns first point value if target < first interpolationPoint value', () => {
    const result = linearInterpolate(1, [
      [5, 20],
      [10, 100],
    ])
    expect(result).toEqual(20)
  })
  it('returns first point value if target equals first interpolationPoint value', () => {
    const result = linearInterpolate(5, [
      [5, 20],
      [10, 100],
    ])
    expect(result).toEqual(20)
  })
  it('returns last point value if target > last interpolationPoint value', () => {
    const result = linearInterpolate(12, [
      [5, 20],
      [10, 100],
    ])
    expect(result).toEqual(100)
  })
  it('returns last point value if target equals last interpolationPoint value', () => {
    const result = linearInterpolate(10, [
      [5, 20],
      [10, 100],
    ])
    expect(result).toEqual(100)
  })
  it('correctly linearly linearInterpolates if between two interpolation points', () => {
    const result = linearInterpolate(20, [
      [5, 20],
      [10, 100],
      [50, 120],
    ])
    expect(result).toEqual(105)
  })
  it('correctly linearly linearInterpolates if between two interpolation points', () => {
    const result = linearInterpolate(10, [
      [5, 20],
      [10, 100],
      [50, 120],
    ])
    expect(result).toEqual(100)
  })
})
