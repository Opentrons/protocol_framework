import type { RGBColor } from 'react-color'

export const rgbaToHex = (rgba: RGBColor): string => {
  const { r, g, b, a } = rgba
  const toHex = (n: number): string => n.toString(16).padStart(2, '0')
  const alpha = a != null ? Math.round(a * 255) : 255
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`
}
