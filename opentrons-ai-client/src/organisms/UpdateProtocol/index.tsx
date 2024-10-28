import styled from 'styled-components'
import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  InputField,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  LargeButton,
  StyledText,
  Link as LinkComponent,
  DropdownMenu,
} from '@opentrons/components'
import type { DropdownOption } from '@opentrons/components'
import { UploadInput } from '../../molecules/UploadInput'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FileUpload } from '../../molecules/FileUpload'
import { useNavigate } from 'react-router-dom'
import { chatPromptAtom, headerWithMeterAtom } from '../../resources/atoms'
import { CSSTransition } from 'react-transition-group'
import { useAtom } from 'jotai'

const updateOptions: DropdownOption[] = [
  {
    name: 'Adapt Python protocol from OT-2 to Flex',
    value: 'adapt_python_protocol',
  },
  { name: 'Change labware', value: 'change_labware' },
  { name: 'Change pipettes', value: 'change_pipettes' },
  { name: 'Other', value: 'other' },
]

const FadeWrapper = styled.div`
  &.fade-enter {
    opacity: 0;
  }
  &.fade-enter-active {
    opacity: 1;
    transition: opacity 1000ms;
  }
  &.fade-exit {
    height: 100%;
    opacity: 1;
  }
  &.fade-exit-active {
    opacity: 0;
    height: 0%;
    transition: opacity 1000ms;
  }
`

const Container = styled(Flex)`
  width: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${JUSTIFY_CENTER};
`

const Spacer = styled(Flex)`
  height: 16px;
`

const ContentBox = styled(Flex)`
  background-color: white;
  border-radius: 16px;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  padding: 32px 24px;
  width: 60%;
`

const HeadingText = styled(StyledText).attrs({
  desktopStyle: 'headingSmallBold',
})``

const BodyText = styled(StyledText).attrs({
  color: COLORS.grey60,
  desktopStyle: 'bodyDefaultRegular',
  paddingBottom: '8px',
  paddingTop: '16px',
})``

const isValidProtocolFileName = (protocolFileName: string): boolean => {
  return protocolFileName.endsWith('.py')
}

export function UpdateProtocol(): JSX.Element {
  const navigate = useNavigate()
  const { t }: { t: (key: string) => string } = useTranslation(
    'protocol_generator'
  )
  const [, setChatPrompt] = useAtom(chatPromptAtom)
  const [headerState, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [updateType, setUpdateType] = useState<DropdownOption | null>(null)
  const [detailsValue, setDetailsValue] = useState<string>('')
  const [fileValue, setFile] = useState<File | null>(null)
  const [pythonText, setPythonTextValue] = useState<string>('')
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    let progress = 0.0
    if (updateType !== null) {
      progress += 0.33
    }

    if (detailsValue !== '') {
      progress += 0.33
    }

    if (pythonText !== '' && fileValue !== null && errorText === null) {
      progress += 0.34
    }

    setHeaderWithMeterAtom({
      displayHeaderWithMeter: true,
      progress,
    })
  }, [
    updateType,
    detailsValue,
    pythonText,
    errorText,
    fileValue,
    setHeaderWithMeterAtom,
  ])

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDetailsValue(event.target.value)
  }

  const handleFileUpload = async (
    file: File & { name: string }
  ): Promise<void> => {
    if (isValidProtocolFileName(file.name)) {
      const text = await file.text().catch(error => {
        console.error('Error reading file:', error)
        setErrorText(t('python_file_read_error'))
      })

      if (typeof text === 'string' && text !== '') {
        setErrorText(null)
        console.log('File read successfully:\n', text)
        setPythonTextValue(text)
      } else {
        setErrorText(t('file_length_error'))
      }

      setFile(file)
    } else {
      setErrorText(t('python_file_type_error'))
      setFile(file)
    }
  }

  function processDataAndNavigateToChat(): void {
    const userPrompt = `Modify the following Python code using the Opentrons Python Protocol API v2. Ensure that the new labware and pipettes are compatible with the Flex robot. Ensure that you perform the correct Type of Update use the Details of Changes.

    Original Python Code:
    \`\`\`python
    ${pythonText}
    \`\`\`

    Type of update:
    - ${updateType?.value}

    Details of Changes:
    - ${detailsValue}
  `
    console.log(userPrompt)

    setChatPrompt(chatData => userPrompt)
    navigate('/chat')
  }

  return (
    <Container>
      <Spacer />
      <ContentBox>
        <HeadingText>{t('update_existing_protocol')}</HeadingText>
        <BodyText>{t('protocol_file')}</BodyText>
        <Flex
          paddingTop={fileValue !== null ? '8px' : '40px'}
          width="auto"
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_CENTER}
        >
          <CSSTransition
            in={fileValue !== null}
            timeout={1000}
            classNames="fade"
            unmountOnExit
          >
            <FadeWrapper>
              {fileValue !== null ? (
                <Flex width="100%" flexDirection={DIRECTION_COLUMN}>
                  <FileUpload
                    file={fileValue}
                    fileError={errorText}
                    handleClick={function (): void {
                      setFile(null)
                      setErrorText(null)
                    }}
                  ></FileUpload>
                </Flex>
              ) : null}
            </FadeWrapper>
          </CSSTransition>

          <CSSTransition
            in={fileValue == null}
            timeout={300}
            classNames="fade"
            unmountOnExit
          >
            <FadeWrapper>
              <UploadInput
                uploadButtonText={t('choose_file')}
                dragAndDropText={
                  <StyledText as="p">
                    <Trans
                      t={t}
                      i18nKey={t('drag_and_drop')}
                      components={{
                        a: (
                          <LinkComponent
                            color={COLORS.blue55}
                            role="button"
                            to={''}
                          />
                        ),
                      }}
                    />
                  </StyledText>
                }
                onUpload={async function (file: File) {
                  try {
                    await handleFileUpload(file)
                  } catch (error) {
                    // todo perhaps make this a toast?
                    console.error('Error uploading file:', error)
                  }
                }}
              />
            </FadeWrapper>
          </CSSTransition>
        </Flex>
        <Flex height={'16px'}></Flex>
        <Flex flexDirection={DIRECTION_COLUMN} width="100%">
          <DropdownMenu
            title={t('type_of_update')}
            width="100%"
            dropdownType="neutral"
            filterOptions={updateOptions}
            currentOption={
              updateType ?? {
                value: '',
                name: 'Select an option',
              }
            }
            onClick={value => {
              const selectedOption = updateOptions.find(v => v.value === value)
              if (selectedOption != null) {
                setUpdateType(selectedOption)
              }
            }}
          />
        </Flex>
        <BodyText>{t('provide_details_of_changes')}</BodyText>
        <InputField
          value={detailsValue}
          onChange={handleInputChange}
          size="medium"
        />
        <Flex
          paddingTop="40px"
          width="auto"
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_END}
        >
          <LargeButton
            disabled={headerState.progress !== 1.0}
            buttonText={t('submit_prompt')}
            onClick={processDataAndNavigateToChat}
          />
        </Flex>
      </ContentBox>
    </Container>
  )
}
