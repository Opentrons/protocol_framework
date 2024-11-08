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
      items.push(getPipetteSpecsV2(leftPipette as PipetteName)?.displayName)
    rightPipette !== '' &&
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
