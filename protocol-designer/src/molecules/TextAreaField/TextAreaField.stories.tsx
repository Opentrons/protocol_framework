import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'
import { TextAreaField as TextAreaFieldComponent } from '.'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof TextAreaFieldComponent> = {
  // ToDo (kk05/02/2024) this should be in Library but at this moment there is the same name component in components
  // The unification for this component will be done when the old component is retired completely.
  title: 'protocol-designer/molecules/TextAreaField',
  component: TextAreaFieldComponent,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof TextAreaFieldComponent>

export const TextAreaField: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <TextAreaFieldComponent
        {...args}
        value={value}
        width="100%"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
      />
    </Flex>
  )
}

TextAreaField.args = {
  title: 'TextAreaField',
  height: '6.8125rem',
  placeholder: 'Placeholder Text',
}
