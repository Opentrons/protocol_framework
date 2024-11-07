import {
  Flex,
  JUSTIFY_SPACE_EVENLY,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { PromptPreview } from '../../molecules/PromptPreview'
import { useForm, FormProvider } from 'react-hook-form'
import { createProtocolAtom, headerWithMeterAtom } from '../../resources/atoms'
import { useAtom } from 'jotai'
import { ProtocolSectionsContainer } from '../../organisms/ProtocolSectionsContainer'
import { generatePromptPreviewData } from '../../resources/utils/createProtocolUtils'
import type { DisplayModules } from '../../organisms/ModulesSection'
import type { DisplayLabware } from '../../organisms/LabwareLiquidsSection'

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
  steps: string[]
}

const TOTAL_STEPS = 5

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)

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
        <ProtocolSectionsContainer />
        <PromptPreview
          handleSubmit={function (): void {
            throw new Error('Function not implemented.')
          }}
          promptPreviewData={generatePromptPreviewData(methods.watch, t)}
        />
      </Flex>
    </FormProvider>
  )
}
