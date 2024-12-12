import { resources } from '..'
import { describe, it } from 'vitest'

describe('Translation consistency between en and zh', () => {
  const enTranslations = resources.en
  const zhTranslations = resources.zh

  const checkKeys = (
    base: Record<string, any>,
    compare: Record<string, any>,
    baseLang: string,
    compareLang: string
  ) => {
    const missingKeys: string[] = []

    const traverseKeys = (obj: object, path = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullPath = path.length > 0 ? `${path}.${key}` : key

        if (value !== null && typeof value === 'object') {
          // Recursively check nested objects
          traverseKeys(value, fullPath)
        } else {
          // Check if key exists and has same type
          const compareObj = path
            .split('.')
            .reduce<Record<string, unknown>>((acc, curr) => {
              return acc !== null && acc !== undefined && curr in acc
                ? (acc[curr] as Record<string, unknown>)
                : {}
            }, compare)

          if (
            compareObj === null ||
            compareObj === undefined ||
            !(key in compareObj) ||
            typeof compareObj[key] !== typeof value
          ) {
            missingKeys.push(fullPath)
          }
        }
      })
    }

    traverseKeys(base)

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing ${compareLang} translations for the following ${baseLang} keys:\n${missingKeys.join(
          '\n'
        )}`
      )
    }
  }

  it('should have all keys in zh that are in en', () => {
    checkKeys(enTranslations, zhTranslations, 'en', 'zh')
  })

  it('should have all keys in en that are in zh', () => {
    checkKeys(zhTranslations, enTranslations, 'zh', 'en')
  })
})
