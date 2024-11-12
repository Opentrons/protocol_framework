import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useFormContext } from 'react-hook-form'
import { useAtom } from 'jotai'
import { v4 as uuidv4 } from 'uuid'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SendButton } from '../../atoms/SendButton'
import {
  chatDataAtom,
  chatHistoryAtom,
  chatPromptAtom,
  tokenAtom,
  updatePromptAtom,
} from '../../resources/atoms'
import { useApiCall } from '../../resources/hooks'
import { calcTextAreaHeight } from '../../resources/utils/utils'
import {
  STAGING_END_POINT,
  PROD_END_POINT,
  LOCAL_END_POINT,
  LOCAL_UPDATE_PROTOCOL_END_POINT,
  PROD_UPDATE_PROTOCOL_END_POINT,
  STAGING_UPDATE_PROTOCOL_END_POINT,
  LOCAL_CREATE_PROTOCOL_END_POINT,
  PROD_CREATE_PROTOCOL_END_POINT,
  STAGING_CREATE_PROTOCOL_END_POINT,
} from '../../resources/constants'

import type { AxiosRequestConfig } from 'axios'
import type { ChatData } from '../../resources/types'

export function InputPrompt(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { register, watch, reset, setValue } = useFormContext()
  const [chatPromptAtomValue] = useAtom(chatPromptAtom)
  const [updatePrompt] = useAtom(updatePromptAtom)
  const [, setChatData] = useAtom(chatDataAtom)
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom)
  const [token] = useAtom(tokenAtom)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const userPrompt = watch('userPrompt') ?? ''
  const [sendAutoFilledPrompt, setSendAutoFilledPrompt] = useState<boolean>(
    false
  )
  const { data, isLoading, callApi } = useApiCall()
  const [requestId, setRequestId] = useState<string>(uuidv4())

  const handleClick = async (
    isUpdateOrCreate: boolean = false
  ): Promise<void> => {
    setRequestId(uuidv4())
    const userInput: ChatData = {
      requestId,
      role: 'user',
      reply: userPrompt,
    }
    reset()
    setChatData(chatData => [...chatData, userInput])

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const url = isUpdateOrCreate
        ? getCreateOrUpdateEndpoint(chatPromptAtomValue.isNewProtocol)
        : getChatEndpoint()

      const config = {
        url,
        method: 'POST',
        headers,
        data: isUpdateOrCreate
          ? getUpdateOrCreatePrompt()
          : {
              message: userPrompt,
              history: chatHistory,
              fake: false,
            },
      }

      setChatHistory(chatHistory => [
        ...chatHistory,
        { role: 'user', content: userPrompt },
      ])
      await callApi(config as AxiosRequestConfig)
      setSubmitted(true)
    } catch (err: any) {
      console.error(`error: ${err.message}`)
      throw err
    }
  }

  const getUpdateOrCreatePrompt = (): any => {
    return chatPromptAtomValue.isNewProtocol ? updatePrompt : updatePrompt // to do: add the create prompt
  }

  useEffect(() => {
    if (submitted && data != null && !isLoading) {
      const { role, reply } = data as ChatData
      const assistantResponse: ChatData = {
        requestId,
        role,
        reply,
      }
      setChatHistory(chatHistory => [
        ...chatHistory,
        { role: 'assistant', content: reply },
      ])
      setChatData(chatData => [...chatData, assistantResponse])
      setSubmitted(false)
    }
  }, [data, isLoading, submitted])

  // This is to autofill the input field for when we navigate to the chat page from the existing/new protocol generator pages
  useEffect(() => {
    setValue('userPrompt', chatPromptAtomValue.prompt)
    setSendAutoFilledPrompt(true)
  }, [])
  const watchUserPrompt = watch('userPrompt')

  useEffect(() => {
    if (sendAutoFilledPrompt) {
      handleClick(true)
      setSendAutoFilledPrompt(false)
    }
  }, [watchUserPrompt])

  return (
    <StyledForm id="User_Prompt">
      <Flex css={CONTAINER_STYLE}>
        <LegacyStyledTextarea
          rows={calcTextAreaHeight(userPrompt as string)}
          placeholder={t('type_your_prompt')}
          {...register('userPrompt')}
        />
        <SendButton
          disabled={userPrompt.length === 0}
          isLoading={isLoading}
          handleClick={() => {
            handleClick()
          }}
        />
      </Flex>
    </StyledForm>
  )
}

const getCreateOrUpdateEndpoint = (isCreateNewProtocol: boolean): string => {
  return isCreateNewProtocol ? getCreateEndpoint() : getUpdateEndpoint()
}

const getChatEndpoint = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_END_POINT
    case 'development':
      return LOCAL_END_POINT
    default:
      return STAGING_END_POINT
  }
}

const getCreateEndpoint = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_CREATE_PROTOCOL_END_POINT
    case 'development':
      return LOCAL_CREATE_PROTOCOL_END_POINT
    default:
      return STAGING_CREATE_PROTOCOL_END_POINT
  }
}

const getUpdateEndpoint = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_UPDATE_PROTOCOL_END_POINT
    case 'development':
      return LOCAL_UPDATE_PROTOCOL_END_POINT
    default:
      return STAGING_UPDATE_PROTOCOL_END_POINT
  }
}

const StyledForm = styled.form`
  width: 100%;
`

const CONTAINER_STYLE = css`
  padding: ${SPACING.spacing40};
  grid-gap: ${SPACING.spacing40};
  flex-direction: ${DIRECTION_ROW};
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadius4};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  max-height: 21.25rem;

  &:focus-within {
    border: 1px ${BORDERS.styleSolid}${COLORS.blue50};
  }
`

const LegacyStyledTextarea = styled.textarea`
  resize: none;
  min-height: 3.75rem;
  max-height: 17.25rem;
  overflow-y: auto;
  background-color: ${COLORS.white};
  border: none;
  outline: none;
  padding: 0;
  box-shadow: none;
  color: ${COLORS.black90};
  width: 100%;
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  padding: 1.2rem 0;
  font-size: 1rem;

  ::placeholder {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
`
