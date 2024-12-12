import { resources } from '..'
import { describe, it, expect } from 'vitest'

describe('Translation consistency between en and zh', () => {
  const enTranslations = resources['en']
  const zhTranslations = resources['zh']

  const checkKeys = (
    base: { [key: string]: any },
    compare: { [key: string]: any },
    baseLang: string,
    compareLang: string
  ) => {
    const missingKeys: string[] = []

    const traverseKeys = (obj: object, path = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullPath = path ? `${path}.${key}` : key

        if (typeof value === 'object' && value !== null) {
          // Recursively check nested objects
          traverseKeys(value, fullPath)
        } else {
          // Check if key exists and has same type
          const compareObj = path
            .split('.')
            .reduce((acc, curr) => acc?.[curr], compare)
          if (!compareObj?.[key] || typeof compareObj[key] !== typeof value) {
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

  it('should have matching value types', () => {
    const checkValueTypes = (
      obj1: { [key: string]: any },
      obj2: { [key: string]: any },
      path = ''
    ) => {
      const typeMismatches: string[] = []

      Object.entries(obj1).forEach(([key, value]) => {
        const fullPath = path ? `${path}.${key}` : key
        const value2 = path
          .split('.')
          .reduce((acc, curr) => acc?.[curr], obj2)?.[key]

        if (value2 !== undefined && typeof value !== typeof value2) {
          typeMismatches.push(
            `${fullPath}: en(${typeof value}) vs zh(${typeof value2})`
          )
        }

        if (typeof value === 'object' && value !== null) {
          checkValueTypes(value, value2, fullPath)
        }
      })

      return typeMismatches
    }

    const typeMismatches = checkValueTypes(enTranslations, zhTranslations)

    if (typeMismatches.length > 0) {
      throw new Error(`Type mismatches found:\n${typeMismatches.join('\n')}`)
    }
  })
})
