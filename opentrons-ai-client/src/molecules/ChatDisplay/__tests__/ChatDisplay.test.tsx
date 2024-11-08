import type * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import { ChatDisplay } from '../index'
import { useForm, FormProvider } from 'react-hook-form'

const RenderChatDisplay = (props: React.ComponentProps<typeof ChatDisplay>) => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <ChatDisplay {...props} />
    </FormProvider>
  )
}

const render = (props: React.ComponentProps<typeof ChatDisplay>) => {
  return renderWithProviders(<RenderChatDisplay {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ChatDisplay', () => {
  let props: React.ComponentProps<typeof ChatDisplay>

  beforeEach(() => {
    props = {
      chat: {
        role: 'assistant',
        reply: 'mock text from the backend',
        requestId: '12351234',
      },
      chatId: 'mockId',
    }
  })
  it('should display response from the backend and label', () => {
    render(props)
    screen.getByText('OpentronsAI')
    screen.getByText('mock text from the backend')
    // ToDO (kk:04/16/2024) activate the following when jsdom's issue is solved
    // const display = screen.getByTextId('ChatDisplay_from_backend')
    // expect(display).toHaveStyle(`background-color: ${COLORS.grey30}`)
  })
  it('should display input from use and label', () => {
    props = {
      chat: {
        role: 'user',
        reply: 'mock text from user input',
        requestId: '12351234',
      },
      chatId: 'mockId',
    }
    render(props)
    screen.getByText('You')
    screen.getByText('mock text from user input')
    // ToDO (kk:04/16/2024) activate the following when jsdom's issue is solved
    // const display = screen.getByTextId('ChatDisplay_from_user')
    // expect(display).toHaveStyle(`background-color: ${COLORS.blue}`)
  })
})
