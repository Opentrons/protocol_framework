import type { ProtocolFile } from '@opentrons/shared-data'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

export const migrateFile = (
  appData: ProtocolFile<DesignerApplicationData>
): ProtocolFile<DesignerApplicationData> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const savedStepForms = designerApplication.data
    ?.savedStepForms as DesignerApplicationData['savedStepForms']

  const savedStepsWithUpdatedHeaterShakerTimerField = Object.values(
    savedStepForms
  ).reduce((acc, form) => {
    if (form.stepType === 'heaterShaker') {
      const { id, heaterShakerSetTimer } = form
      return {
        ...acc,
        [id]: {
          ...form,
          heaterShakerSetTimer: JSON.parse(heaterShakerSetTimer),
        },
      }
    }
    return acc
  }, {})

  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...savedStepsWithUpdatedHeaterShakerTimerField,
        },
      },
    },
  }
}
