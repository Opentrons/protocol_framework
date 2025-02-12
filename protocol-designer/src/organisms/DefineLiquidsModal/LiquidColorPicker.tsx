import { SketchPicker } from 'react-color'
import { Controller } from 'react-hook-form'

import { Flex, POSITION_ABSOLUTE } from '@opentrons/components'
import {
  DEFAULT_LIQUID_COLORS,
} from '@opentrons/shared-data'

import type { RefObject } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import type { ColorResult, RGBColor } from 'react-color'
import type { Ingredient } from '@opentrons/step-generation'

interface LiquidColorPickerProps {
  chooseColorWrapperRef: RefObject<HTMLDivElement>
  control: Control<Ingredient, any>
  color: string
  setValue: UseFormSetValue<Ingredient>
}


const rgbaToHex = (rgba: RGBColor): string => {
  const { r, g, b, a } = rgba
  const toHex = (n: number): string => n.toString(16).padStart(2, '0')
  const alpha = a != null ? Math.round(a * 255) : 255
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`
}

export function LiquidColorPicker({ chooseColorWrapperRef, control, color, setValue }: LiquidColorPickerProps): JSX.Element {
  return (
    <Flex
      position={POSITION_ABSOLUTE}
      left="4.375rem"
      top="4.6875rem"
      ref={chooseColorWrapperRef}
      zIndex={2}
    >
      <Controller
        name="displayColor"
        control={control}
        render={({ field }) => (
          <SketchPicker
            presetColors={DEFAULT_LIQUID_COLORS}
            color={color}
            onChange={(color: ColorResult) => {
              const hex = rgbaToHex(color.rgb)
              setValue('displayColor', hex)
              field.onChange(hex)
            }}
          />
        )}
      />
    </Flex>
  )
}
