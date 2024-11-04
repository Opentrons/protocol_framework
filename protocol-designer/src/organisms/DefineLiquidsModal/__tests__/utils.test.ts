import { describe, it, expect } from 'vitest'
import { checkColor } from '../utils'

describe('checkColor', () => {
  it('should return true for very dark colors', () => {
    expect(checkColor('#000000')).toBe(true)
    expect(checkColor('#0a0a0a')).toBe(true)
  })

  it('should return true for very light colors', () => {
    expect(checkColor('#ffffff')).toBe(true)
    expect(checkColor('#f5f5f5')).toBe(true)
  })

  it('should return false for colors with medium luminance', () => {
    expect(checkColor('#808080')).toBe(false)
    expect(checkColor('#ff0000')).toBe(false)
    expect(checkColor('#00ff00')).toBe(false)
    expect(checkColor('#0000ff')).toBe(false)
  })
})
