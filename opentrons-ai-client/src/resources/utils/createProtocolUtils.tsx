import {
  getAllDefinitions,
  getLabwareDisplayName,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'
import type { PipetteName } from '@opentrons/shared-data'
import { OTHER } from '../../organisms/ApplicationSection'
import {
  TWO_PIPETTES,
  OPENTRONS_OT2,
  OPENTRONS_FLEX,
  FLEX_GRIPPER,
  NO_PIPETTES,
} from '../../organisms/InstrumentsSection'
import type { UseFormWatch } from 'react-hook-form'
import type { CreateProtocolFormData } from '../../pages/CreateProtocol'

export function generatePromptPreviewApplicationItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const {
    application: { scientificApplication, otherApplication, description },
  } = watch()

  const scientificOrOtherApplication =
    scientificApplication === OTHER
      ? otherApplication
      : scientificApplication !== ''
      ? t(scientificApplication)
      : ''

  return [
    scientificOrOtherApplication !== '' && scientificOrOtherApplication,
    description !== '' && description,
  ].filter(Boolean)
}

export function generatePromptPreviewInstrumentItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const {
    instruments: { robot, pipettes, leftPipette, rightPipette, flexGripper },
  } = watch()

  const items = []

  robot !== '' && items.push(t(robot))

  if (pipettes === TWO_PIPETTES || robot === OPENTRONS_OT2) {
    leftPipette !== '' &&
      leftPipette !== NO_PIPETTES &&
      items.push(getPipetteSpecsV2(leftPipette as PipetteName)?.displayName)

    rightPipette !== '' &&
      rightPipette !== NO_PIPETTES &&
      items.push(getPipetteSpecsV2(rightPipette as PipetteName)?.displayName)
  } else {
    items.push(pipettes !== '' && t(pipettes))
  }

  if (robot === OPENTRONS_FLEX && flexGripper === FLEX_GRIPPER) {
    items.push(t(flexGripper))
  }

  return items.filter(Boolean)
}

export function generatePromptPreviewModulesItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { modules } = watch()

  if (modules === undefined || modules?.length === 0) return []

  const items = modules?.map(module =>
    module.adapter === undefined || module.adapter?.name === ''
      ? module.name
      : `${module.name} with ${module.adapter.name}`
  )

  return items.filter(Boolean)
}

export function generatePromptPreviewLabwareLiquidsItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { labwares, liquids } = watch()

  const items: string[] = []
  const defs = getAllDefinitions()

  labwares?.forEach(labware => {
    items.push(getLabwareDisplayName(defs[labware.labwareURI]) as string)
  })

  liquids?.forEach(liquid => {
    items.push(liquid)
  })

  return items.filter(Boolean)
}

export function generatePromptPreviewStepsItems(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): string[] {
  const { steps } = watch()

  if (steps === undefined || steps?.length === 0) return []
  if (typeof steps === 'string') return [steps]

  return steps.filter(Boolean)
}

export function generatePromptPreviewData(
  watch: UseFormWatch<CreateProtocolFormData>,
  t: any
): Array<{
  title: string
  items: string[]
}> {
  return [
    {
      title: t('application_title'),
      items: generatePromptPreviewApplicationItems(watch, t),
    },
    {
      title: t('instruments_title'),
      items: generatePromptPreviewInstrumentItems(watch, t),
    },
    {
      title: t('modules_title'),
      items: generatePromptPreviewModulesItems(watch, t),
    },
    {
      title: t('labware_liquids_title'),
      items: generatePromptPreviewLabwareLiquidsItems(watch, t),
    },
    {
      title: t('steps_title'),
      items: generatePromptPreviewStepsItems(watch, t),
    },
  ]
}

export function generateChatPrompt(
  values: CreateProtocolFormData,
  t: any
): string {
  const defs = getAllDefinitions()

  let prompt = ''

  prompt += t('create_protocol_prompt_robot', {
    robotType: t(values.instruments.robot),
  })
  prompt += `${t('application_title')}: ${t(
    values.application.scientificApplication
  )}\n`
  prompt += `${t('description')}: ${values.application.description}\n\n`

  prompt += `${t('pipette_mounts')}:\n`
  if (values.instruments.pipettes === TWO_PIPETTES) {
    if (values.instruments.leftPipette !== NO_PIPETTES) {
      prompt += `- ${
        getPipetteSpecsV2(values.instruments.leftPipette as PipetteName)
          ?.displayName
      } ${t('mounted_left')}\n`
    }
    if (values.instruments.rightPipette !== NO_PIPETTES) {
      prompt += `- ${
        getPipetteSpecsV2(values.instruments.rightPipette as PipetteName)
          ?.displayName
      } ${t('mounted_right')}\n`
    }
  } else {
    prompt += `- ${t(values.instruments.pipettes)}\n`
  }

  if (values.instruments.flexGripper === FLEX_GRIPPER) {
    prompt += `- ${t('with_flex_gripper')}\n`
  }

  prompt += `\n${t('modules_title')}:\n ${values.modules
    .map(
      module =>
        `- ${module.name}${
          module.adapter?.name != null && ` with ${module.adapter.name}`
        }`
    )
    .join('\n')}\n`

  prompt += `\n${t('labware_section_title')}: \n${values.labwares
    .map(
      labware =>
        `- ${getLabwareDisplayName(defs[labware.labwareURI])} x ${
          labware.count
        }`
    )
    .join('\n')}\n`

  prompt += `\n${t('liquid_section_title')}: \n${values.liquids
    .map(liquid => `- ${liquid}`)
    .join('\n')}\n`

  prompt += `\n${t('steps_section_title')}: \n${
    Array.isArray(values.steps)
      ? values.steps.map(step => `- ${step}`).join('\n')
      : values.steps
  }\n`

  return prompt
}
