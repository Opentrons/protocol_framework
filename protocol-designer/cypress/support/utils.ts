export const isEnumValue = <T extends object>(
  enumObjs: T[],
  values: unknown | unknown[]
): boolean => {
  const valueArray = Array.isArray(values) ? values : [values]
  return valueArray.every(value =>
    enumObjs.some(enumObj =>
      Object.values(enumObj).includes(value as T[keyof T])
    )
  )
}

export function isFunctionInRecord(
  functionMap: Record<string, any>,
  step: string
): boolean {
  return Object.keys(functionMap).includes(step)
}
