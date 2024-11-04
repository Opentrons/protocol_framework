import type { ProtocolFile } from '@opentrons/shared-data'
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands'

const getTimeFromIndividualUnits = (
  seconds: string,
  minutes: string,
  hours?: string
): string => {
  const hoursString = hours ? `${hours}:` : ''
  return `${hoursString}${minutes}:${seconds}`
}

export const migrateFile = (
  appData: ProtocolFile<DesignerApplicationData>
): ProtocolFile<DesignerApplicationData> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }

  const savedStepForms = designerApplication.data
    ?.savedStepForms as DesignerApplicationData['savedStepForms']

  const savedStepsWithConsolidatedTimeField = Object.values(
    savedStepForms
  ).reduce((acc, form) => {
    if (form.stepType === 'pause') {
      const { id, pauseHour, pauseMinute, pauseSecond, pauseTime } = form
      const pauseFormIndividualTimeUnitsRemoved = Object.keys(
        form as Object
      ).reduce(
        (acc, key) =>
          !['pauseSecond', 'pauseMinute', 'pauseHour'].includes(key)
            ? { ...acc, [key]: form[key] }
            : acc,
        { pauseTime }
      )
      return pauseTime != null
        ? { ...acc, [id]: pauseFormIndividualTimeUnitsRemoved }
        : {
            ...acc,
            [id]: {
              ...pauseFormIndividualTimeUnitsRemoved,
              pauseTime: getTimeFromIndividualUnits(
                pauseSecond as string,
                pauseMinute as string,
                pauseHour as string
              ),
            },
          }
    } else if (form.stepType === 'heaterShaker') {
      const {
        id,
        heaterShakerTimerMinutes,
        heaterShakerTimerSeconds,
        heaterShakerTimer,
      } = form
      const heaterShakerFormIndividualTimeUnitsRemoved = Object.keys(
        form as Object
      ).reduce(
        (acc, key) =>
          !['heaterShakerTimerMinutes', 'heaterShakerTimerSeconds'].includes(
            key
          )
            ? { ...acc, [key]: form[key] }
            : acc,
        { heaterShakerTimer }
      )

      return heaterShakerTimer != null
        ? { ...acc, [id]: heaterShakerFormIndividualTimeUnitsRemoved }
        : {
            ...acc,
            [id]: {
              ...heaterShakerFormIndividualTimeUnitsRemoved,
              heaterShakerTimer: getTimeFromIndividualUnits(
                heaterShakerTimerSeconds as string,
                heaterShakerTimerMinutes as string
              ),
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
          ...savedStepsWithConsolidatedTimeField,
        },
      },
    },
  }
}
