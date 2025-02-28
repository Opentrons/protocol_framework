import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce' // Adjust the import path as necessary

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should return the updated value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    // Update the value
    rerender({ value: 'updated', delay: 500 })

    // Fast-forward time by 499ms (just before the delay)
    act(() => {
      vi.advanceTimersByTime(499)
    })

    // Value should still be the initial one
    expect(result.current).toBe('initial')

    // Fast-forward time by 1ms (total 500ms)
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Value should now be updated
    expect(result.current).toBe('updated')
  })

  it('should cancel the previous timeout if the value changes within the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    // Update the value
    rerender({ value: 'updated', delay: 500 })

    // Fast-forward time by 250ms (halfway through the delay)
    act(() => {
      vi.advanceTimersByTime(250)
    })

    // Update the value again
    rerender({ value: 'final', delay: 500 })

    // Fast-forward time by 499ms (just before the new delay)
    act(() => {
      vi.advanceTimersByTime(499)
    })

    // Value should still be the initial one
    expect(result.current).toBe('initial')

    // Fast-forward time by 1ms (total 500ms from the last update)
    act(() => {
      vi.advanceTimersByTime(1)
    })

    // Value should now be the final one
    expect(result.current).toBe('final')
  })

  it('should clear the timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useDebounce('initial', 500))

    expect(result.current).toBe('initial')

    // Unmount the hook
    unmount()

    // Fast-forward time by 500ms
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // No state update should have occurred after unmount
    expect(result.current).toBe('initial')
  })
})
