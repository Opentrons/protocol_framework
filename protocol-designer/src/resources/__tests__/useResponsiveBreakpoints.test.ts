import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsiveBreakpoints } from '../useResponsiveBreakpoints'

describe('useResponsiveBreakpoints', () => {
  const resizeWindow = (width: number) => {
    window.innerWidth = width
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  it('should return "xl" when width is greater than or equal to 1440', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints())
    resizeWindow(1440)
    expect(result.current).toBe('xl')
  })

  it('should return "lg" when width is between 1280 and 1439', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints())
    resizeWindow(1280)
    expect(result.current).toBe('lg')
    resizeWindow(1439)
    expect(result.current).toBe('lg')
  })

  it('should return "md" when width is between 1024 and 1279', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints())
    resizeWindow(1024)
    expect(result.current).toBe('md')
    resizeWindow(1279)
    expect(result.current).toBe('md')
  })

  it('should return "sm" when width is between 768 and 1023', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints())
    resizeWindow(768)
    expect(result.current).toBe('sm')
    resizeWindow(1023)
    expect(result.current).toBe('sm')
  })

  it('should return "xs" when width is less than 768', () => {
    const { result } = renderHook(() => useResponsiveBreakpoints())
    resizeWindow(767)
    expect(result.current).toBe('xs')
  })
})
