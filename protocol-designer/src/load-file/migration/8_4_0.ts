import type { ModuleModel, ProtocolFile } from '@opentrons/shared-data'
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

  const magneticModuleModelById = appData.commands.reduce<
    Record<string, ModuleModel | null>
  >((acc, command) => {
    if (command.commandType === 'loadModule') {
      const { model = null, moduleId = null } = command.params
      if (moduleId != null) {
        return {
          ...acc,
          [moduleId]: model,
        }
      }
      return acc
    }
    return acc
  }, {})
  const savedMagnetSteps = Object.values(savedStepForms).reduce((acc, form) => {
    if (form.stepType === 'magnet') {
      const { id, moduleId } = form
      const moduleModel = magneticModuleModelById[moduleId]
      return {
        ...acc,
        [id]: {
          ...form,
          moduleModel: moduleModel,
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
          ...savedMagnetSteps,
        },
      },
    },
  }
}
