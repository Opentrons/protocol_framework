import { describe, it, expect } from 'vitest'
import { formatPyStr, formatPyValue } from '../utils/pythonFormat'

describe('pythonFormat utils', () => {
  it('format string', () => {
    expect(
      formatPyStr(`Funky quotes " '\nNewline\tUnicode µ, Backslash\\`)
    ).toEqual(`"Funky quotes \\" '\\nNewline\\tUnicode µ, Backslash\\\\"`)
  })

  it('format number', () => {
    expect(formatPyValue(3.14)).toBe('3.14')
    expect(formatPyValue(-1e-10)).toBe('-1e-10')
    // this is the valid way to write these values in Python:
    expect(formatPyValue(-1 / 0)).toBe('float("-Infinity")')
    expect(formatPyValue(0 / 0)).toBe('float("NaN")')
  })

  it('format boolean', () => {
    expect(formatPyValue(true)).toBe('True')
    expect(formatPyValue(false)).toBe('False')
  })

  it('format list', () => {
    expect(
      formatPyValue(['hello', 'world', 2.71828, true, false, undefined])
    ).toBe('["hello", "world", 2.71828, True, False, None]')
  })

  it('format dict', () => {
    // null:
    expect(formatPyValue(null)).toBe('None')
    // zero entries:
    expect(formatPyValue({})).toBe('{}')
    // one entry:
    expect(formatPyValue({ one: 'two' })).toBe('{"one": "two"}')
    expect(formatPyValue({ 3: 4 })).toBe('{"3": 4}')
    // multiple entries:
    expect(formatPyValue({ yes: true, no: false })).toBe(
      '{\n    "yes": True,\n    "no": False,\n}'
    )
    // nested entries:
    expect(
      formatPyValue({ hello: 'world', nested: { inner: 5, extra: 6 } })
    ).toBe(
      '{\n    "hello": "world",\n    "nested": {\n        "inner": 5,\n        "extra": 6,\n    },\n}'
    )
  })
})
