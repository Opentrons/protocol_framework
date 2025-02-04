/** Utility functions for Python code generation. */

export const INDENT = '    '

/** Indent each of the lines in `text`. */
export function indentLines(text: string): string {
  return text
    .split('\n')
    .map(line => (line ? INDENT + line : line))
    .join('\n')
}

/** Render an arbitrary JavaScript value to Python. */
export function formatPyValue(value: any): string {
  switch (typeof value) {
    case 'undefined':
      return 'None'
    case 'boolean':
      return value ? 'True' : 'False'
    case 'number':
      // `float("Infinity")` and `float("NaN")` is how you write those values in Python
      return Number.isFinite(value) ? `${value}` : `float("${value}")`
    case 'string':
      return formatPyStr(value)
    case 'object':
      if (value === null) {
        return 'None'
      } else if (Array.isArray(value)) {
        return formatPyList(value)
      } else {
        return formatPyDict(value)
      }
    default:
      throw Error('Cannot render value as Python', { cause: value })
  }
}

/** Render the string value to Python. */
export function formatPyStr(str: string): string {
  // Later, we can do something more elegant like outputting 'single-quoted' if str contains
  // double-quotes, but for now stringify() produces a valid and properly escaped Python string.
  return JSON.stringify(str)
}

/** Render an array value as a Python list. */
export function formatPyList(list: any[]): string {
  return `[${list.map(value => formatPyValue(value)).join(', ')}]`
}

/** Render an object as a Python dict. */
export function formatPyDict(dict: Record<string, any>): string {
  const dictEntries = Object.entries(dict)
  // Render dict on single line if it has 1 entry, else render 1 entry per line.
  if (dictEntries.length <= 1) {
    return `{${dictEntries
      .map(([key, value]) => `${formatPyStr(key)}: ${formatPyValue(value)}`)
      .join(', ')}}`
  } else {
    return `{\n${indentLines(
      dictEntries
        .map(([key, value]) => `${formatPyStr(key)}: ${formatPyValue(value)}`)
        .join(',\n')
    )},\n}`
  }
}
