import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScreenSizeCheck } from '../useScreenSizeCheck'

describe('useScreenSizeCheck', () => {
  // it('should return true if the window size is greater than 600px x 650px', () => {
  //   vi.stubGlobal('innerWidth', 1440)
  //   vi.stubGlobal('innerHeight', 900)
  //   const { result } = renderHook(() => useScreenSizeCheck())
  //   expect(result.current).toBe(true)
  // })
  // it('should return false if the window height is less than 650px', () => {
  //   vi.stubGlobal('innerWidth', 1440)
  //   vi.stubGlobal('innerHeight', 649)
  //   window.dispatchEvent(new Event('resize'))
  //   const { result } = renderHook(() => useScreenSizeCheck())
  //   expect(result.current).toBe(false)
  // })
  // it('should return true if the window width is 768px', () => {
  //   vi.stubGlobal('innerWidth', 768)
  //   vi.stubGlobal('innerHeight', 900)
  //   window.dispatchEvent(new Event('resize'))
  //   const { result } = renderHook(() => useScreenSizeCheck())
  //   expect(result.current).toBe(false)
  // })
  // it('should return false if the window width is less than 768px', () => {
  //   vi.stubGlobal('innerWidth', 767)
  //   vi.stubGlobal('innerHeight', 900)
  //   window.dispatchEvent(new Event('resize'))
  //   const { result } = renderHook(() => useScreenSizeCheck())
  //   expect(result.current).toBe(false)
  // })
  // it('should return false if the window width is less than 768px and height is less than 650px', () => {
  //   vi.stubGlobal('innerWidth', 767)
  //   vi.stubGlobal('innerHeight', 649)
  //   window.dispatchEvent(new Event('resize'))
  //   const { result } = renderHook(() => useScreenSizeCheck())
  //   expect(result.current).toBe(false)
  // })
  const originalWidth = window.screen.width
  const originalHeight = window.screen.height

  beforeEach(() => {
    Object.defineProperty(window.screen, 'width', {
      writable: true,
      configurable: true,
      value: originalWidth,
    })
    Object.defineProperty(window.screen, 'height', {
      writable: true,
      configurable: true,
      value: originalHeight,
    })
  })

  afterEach(() => {
    Object.defineProperty(window.screen, 'width', {
      writable: true,
      configurable: true,
      value: originalWidth,
    })
    Object.defineProperty(window.screen, 'height', {
      writable: true,
      configurable: true,
      value: originalHeight,
    })
  })

  it('should return true if screen size is larger than breakpoints', () => {
    Object.defineProperty(window.screen, 'width', { value: 800 })
    Object.defineProperty(window.screen, 'height', { value: 700 })

    const { result } = renderHook(() => useScreenSizeCheck())

    expect(result.current).toBe(true)
  })

  it('should return false if screen size is smaller than breakpoints', () => {
    Object.defineProperty(window.screen, 'width', { value: 700 })
    Object.defineProperty(window.screen, 'height', { value: 600 })

    const { result } = renderHook(() => useScreenSizeCheck())

    expect(result.current).toBe(false)
  })

  it('should update value on window resize', () => {
    const { result } = renderHook(() => useScreenSizeCheck())

    expect(result.current).toBe(originalWidth > 768 && originalHeight > 650)

    act(() => {
      Object.defineProperty(window.screen, 'width', { value: 800 })
      Object.defineProperty(window.screen, 'height', { value: 700 })
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(true)

    act(() => {
      Object.defineProperty(window.screen, 'width', { value: 700 })
      Object.defineProperty(window.screen, 'height', { value: 600 })
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(false)
  })
})
