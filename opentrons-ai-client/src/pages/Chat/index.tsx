import { useForm, FormProvider } from 'react-hook-form'
import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { useAtom } from 'jotai'
import { useRef, useEffect } from 'react'
import { chatDataAtom } from '../../resources/atoms'
import { ChatDisplay } from '../../molecules/ChatDisplay'
import { ChatFooter } from '../../molecules/ChatFooter'
import { PromptGuide } from '../../molecules/PromptGuide'
import styled from 'styled-components'
import { Footer } from '../../molecules/Footer'

export interface InputType {
  userPrompt: string
}

export function Chat(): JSX.Element | null {
  const methods = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })

  const [chatData] = useAtom(chatDataAtom)
  const scrollRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (scrollRef.current != null)
      scrollRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
  }, [chatData.length])

  return (
    <FormProvider {...methods}>
      <Flex
        padding={`${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing20}`}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing12}
        height="50vh"
        width="100%"
      >
        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing24}
        >
          <PromptGuide />

          <ChatDataContainer>
            {chatData.length > 0
              ? chatData.map((chat, index) => (
                  <ChatDisplay
                    key={`prompt-from_${chat.role}_${index}`}
                    chat={chat}
                    chatId={`${chat.role}_${index}`}
                  />
                ))
              : null}
          </ChatDataContainer>
          <span ref={scrollRef} />
        </Flex>
        <ChatFooter />
        <Footer></Footer>
      </Flex>
    </FormProvider>
  )
}

const ChatDataContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
`
