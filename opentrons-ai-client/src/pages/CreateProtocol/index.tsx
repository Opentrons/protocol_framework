import {
  COLORS,
  Flex,
  JUSTIFY_SPACE_EVENLY,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { PromptPreview } from '../../molecules/PromptPreview'
import { useForm, FormProvider } from 'react-hook-form'
import {
  chatPromptAtom,
  createProtocolAtom,
  headerWithMeterAtom,
} from '../../resources/atoms'
import { useAtom } from 'jotai'
import { ProtocolSectionsContainer } from '../../organisms/ProtocolSectionsContainer'
import {
  generateChatPrompt,
  generatePromptPreviewData,
} from '../../resources/utils/createProtocolUtils'
import type { DisplayModules } from '../../organisms/ModulesSection'
import type { DisplayLabware } from '../../organisms/LabwareLiquidsSection'
import { useNavigate } from 'react-router-dom'
import { useTrackEvent } from '../../resources/hooks/useTrackEvent'

export interface CreateProtocolFormData {
  application: {
    scientificApplication: string
    otherApplication?: string
    description: string
  }
  instruments: {
    robot: string
    pipettes: string
    leftPipette: string
    rightPipette: string
    flexGripper: string
  }
  modules: DisplayModules[]
  labwares: DisplayLabware[]
  liquids: string[]
  steps: string[] | string
}

const TOTAL_STEPS = 5

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)
  const [, setChatPrompt] = useAtom(chatPromptAtom)
  const navigate = useNavigate()
  const trackEvent = useTrackEvent()

  const methods = useForm<CreateProtocolFormData>({
    defaultValues: {
      application: {
        scientificApplication: '',
        otherApplication: '',
        description: '',
      },
      instruments: {},
      modules: [],
      labwares: [],
      liquids: [''],
      steps: [''],
    },
  })

  function calculateProgress(): number {
    return currentStep > 0 ? currentStep / TOTAL_STEPS : 0
  }

  useEffect(() => {
    setHeaderWithMeterAtom({
      displayHeaderWithMeter: true,
      progress: calculateProgress(),
    })
  }, [currentStep])

  useEffect(() => {
    return () => {
      setHeaderWithMeterAtom({
        displayHeaderWithMeter: false,
        progress: 0,
      })

      methods.reset()
      setCreateProtocolAtom({
        currentStep: 0,
        focusStep: 0,
      })
    }
  }, [])

  const [rightWidth, setRightWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)

  function handleMouseDown(): void {
    setIsResizing(true)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (isResizing) {
      const newWidth =
        ((window.innerWidth - e.clientX) / window.innerWidth) * 100
      if (newWidth >= 10 && newWidth <= 90) {
        setRightWidth(newWidth)
      }
    }
  }

  function handleMouseUp(): void {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <FormProvider {...methods}>
      <Flex
        position={POSITION_RELATIVE}
        justifyContent={JUSTIFY_SPACE_EVENLY}
        gap={SPACING.spacing32}
        margin={`${SPACING.spacing16} ${SPACING.spacing16}`}
        height="100%"
        width="100%"
      >
        <div style={{ flex: 1, height: '100%' }}>
          <ProtocolSectionsContainer />
        </div>
        <div
          style={{
            width: '3px',
            cursor: 'col-resize',
            backgroundColor: COLORS.grey30,
            height: '100%',
            position: 'relative',
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              width: '16px',
              height: '24px',
              backgroundColor: COLORS.grey30,
              borderRadius: '16px',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
            }}
          >
            <div
              style={{
                width: '2px',
                height: '10px',
                borderRadius: '12px',
                backgroundColor: COLORS.white,
              }}
            />
            <div
              style={{
                width: '2px',
                height: '10px',
                borderRadius: '12px',
                backgroundColor: COLORS.white,
              }}
            />
          </div>
        </div>
        <div style={{ width: `${rightWidth}%`, height: '100%' }}>
          <PromptPreview
            handleSubmit={() => {
              const chatPromptData = generateChatPrompt(methods.getValues(), t)

              setChatPrompt({
                prompt: chatPromptData,
                isNewProtocol: true,
              })

              trackEvent({
                name: 'submit-prompt',
                properties: {
                  prompt: chatPromptData,
                },
              })

              navigate('/chat')
            }}
            isSubmitButtonEnabled={currentStep === TOTAL_STEPS}
            promptPreviewData={generatePromptPreviewData(methods.watch, t)}
          />
        </div>
      </Flex>
    </FormProvider>
  )
}
