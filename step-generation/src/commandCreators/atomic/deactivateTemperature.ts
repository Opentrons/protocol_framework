import {
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { uuid } from '../../utils'
import * as errorCreators from '../../errorCreators'
import type { ModuleOnlyParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

/** Disengage temperature target for specified module. */
export const deactivateTemperature: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { moduleId } = args

  if (moduleId === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }
  const module = invariantContext.moduleEntities[moduleId]
  const moduleType = module?.type
  const modulePythonName = module?.pythonName
  const params = {
    moduleId,
  }

  if (moduleType === TEMPERATURE_MODULE_TYPE) {
    return {
      commands: [
        {
          commandType: 'temperatureModule/deactivate',
          key: uuid(),
          params,
        },
      ],
      python: `${modulePythonName}.deactivate()`,
    }
  } else if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    return {
      commands: [
        {
          commandType: 'thermocycler/deactivateLid',
          key: uuid(),
          params,
        },
        {
          commandType: 'thermocycler/deactivateBlock',
          key: uuid(),
          params,
        },
      ],
      python: `${modulePythonName}.deactivate_lid()\n${modulePythonName}.deactivate_block()`,
    }
  } else if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    return {
      commands: [
        {
          commandType: 'heaterShaker/deactivateHeater',
          key: uuid(),
          params,
        },
      ],
      python: `${modulePythonName}.deactivate_heater()`,
    }
  } else {
    console.error(
      `setTemperature expected module ${moduleId} to be ${TEMPERATURE_MODULE_TYPE}, ${THERMOCYCLER_MODULE_TYPE} or ${HEATERSHAKER_MODULE_TYPE}, got ${moduleType}`
    )
    // NOTE: "missing module" isn't exactly the right error here, but better than a whitescreen!
    // This should never be shown.
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }
}
