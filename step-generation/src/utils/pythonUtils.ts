export const INDENT = `    `

export function indentLines(text: string) {
  return text
    .split('\n')
    .map(line => (line.length ? INDENT + line : line))
    .join(`\n`)
}

export function genPyStr(str: string): string {
  return JSON.stringify(str) // takes care of escaping
}

export function genPyValue(value: any): string {
  switch (typeof value) {
    case 'undefined':
      return `None`
    case 'boolean':
      return value ? `True` : `False`
    case 'number': // float("-Infinity") and float("Nan") are valid in Python
      return Number.isFinite(value) ? `${value}` : `float("${value}")`
    case 'string':
      return genPyStr(value)
    case 'object':
      if (value === null) {
        return `None`
      } else if (Array.isArray(value)) {
        return genPyList(value)
      } else {
        return genPyDict(value)
      }
    default:
      throw Error('Cannot render value as Python', { cause: value })
  }
}

export function genPyList(list: any[]): string {
  return `[${list.map(value => genPyValue(value)).join(`, `)}]`
}

export function genPyDict(dict: Record<string, any>): string {
  const dictEntries = Object.entries(dict)
  const openingBrace = dictEntries.length > 1 ? `{\n` : `{`
  const closingBrace = dictEntries.length > 1 ? `,\n}` : `}`
  const separator = dictEntries.length > 1 ? `,\n` : `, `
  const entriesString = dictEntries
    .map(([key, value]) => `${genPyStr(key)}: ${genPyValue(value)}`)
    .join(separator)
  const indentedEntries =
    dictEntries.length > 1 ? indentLines(entriesString) : entriesString
  return `${openingBrace}${indentedEntries}${closingBrace}`
}
