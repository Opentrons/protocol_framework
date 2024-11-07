import {
  Modal,
  Flex,
  SPACING,
  ALIGN_FLEX_END,
  SecondaryButton,
  StyledText,
  PrimaryButton,
  InputField,
} from '@opentrons/components'
import { useAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { feedbackModalAtom } from '../../resources/atoms'
import { useState } from 'react'

export function FeedbackModal(): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  const [feedbackValue, setFeedbackValue] = useState<string>('')
  const [, setShowFeedbackModal] = useAtom(feedbackModalAtom)

  return (
    <Modal
      title={t(`send_feedback_to_opentrons`)}
      onClose={() => {
        setShowFeedbackModal(false)
      }}
      footer={
        <Flex
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap={SPACING.spacing8}
          justifyContent={ALIGN_FLEX_END}
        >
          <SecondaryButton
            onClick={() => {
              setShowFeedbackModal(false)
            }}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t(`cancel`)}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              setShowFeedbackModal(false)
            }}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t(`send_feedback`)}
            </StyledText>
          </PrimaryButton>
        </Flex>
      }
    >
      <InputField
        title={t(`send_feedback_input_title`)}
        size="medium"
        value={feedbackValue}
        onChange={event => {
          setFeedbackValue(event.target.value as string)
        }}
      ></InputField>
    </Modal>
  )
}
