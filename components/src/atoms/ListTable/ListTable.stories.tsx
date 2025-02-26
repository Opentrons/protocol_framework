import { Flex, Tag, VIEWPORT } from '@opentrons/components'

import { ListTable as ListTableComponent } from '.'

import type { ComponentProps } from 'react'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/ListTable',
  component: ListTableComponent,
  argTypes: {
    headers: {
      control: 'array',
      description: 'Headers for the list table',
    },
    tagCount: {
      control: { type: 'range', min: 1, max: 99, step: 1 },
      description:
        'Number of Tag components to include as example child components.',
    },
  },
  parameters: VIEWPORT.touchScreenViewport,
} as Meta

interface ListTableStoryProps
  extends ComponentProps<typeof ListTableComponent> {
  tagCount: number
}

const Template: Story<ListTableStoryProps> = args => {
  const { tagCount, ...listTableProps } = args

  const renderRows = () => {
    const rows = []
    for (let i = 0; i < tagCount; i++) {
      rows.push(
        <Flex width="100%">
          <Tag
            text={`Tag ${i + 1}`}
            type={
              i % 3 === 0 ? 'default' : i % 3 === 1 ? 'interactive' : 'branded'
            }
            iconName={i % 2 === 0 ? 'alert-circle' : 'check-circle'}
            iconPosition={i % 2 === 0 ? 'left' : 'right'}
          />
        </Flex>
      )
    }
    return rows
  }

  return (
    <ListTableComponent {...listTableProps}>{renderRows()}</ListTableComponent>
  )
}

export const ListTable = Template.bind({})
ListTable.args = {
  headers: ['Name', 'Type', 'Description'],
  tagCount: 3,
}
