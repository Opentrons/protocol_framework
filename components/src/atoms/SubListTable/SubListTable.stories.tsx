import { Flex, Tag, VIEWPORT } from '@opentrons/components'

import { SubListTable as SubListTableComponent } from './index'

import type { ComponentProps } from 'react'
import type { Story, Meta } from '@storybook/react'

export default {
  title: 'Library/Atoms/SubListTable',
  component: SubListTableComponent,
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

interface SubListTableStoryProps
  extends ComponentProps<typeof SubListTableComponent> {
  tagCount: number
}

const Template: Story<SubListTableStoryProps> = args => {
  const { tagCount, ...subListTableProps } = args

  const renderTags = () => {
    const tags = []
    for (let i = 0; i < tagCount; i++) {
      tags.push(
        <Flex key={`tag-${i}`} width="100%">
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
    return tags
  }

  return (
    <SubListTableComponent {...subListTableProps}>
      {renderTags()}
    </SubListTableComponent>
  )
}

export const SubListTable = Template.bind({})
SubListTable.args = {
  headers: ['Name', 'Type', 'Description'],
  tagCount: 3,
}
