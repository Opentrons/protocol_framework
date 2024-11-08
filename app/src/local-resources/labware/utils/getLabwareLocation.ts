import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'

import {
  getModuleDisplayLocation,
  getModuleModel,
} from '/app/local-resources/modules'

import type {
  LabwareDefinition2,
  LabwareLocation,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { LoadedLabwares } from '/app/local-resources/labware'
import type { LoadedModules } from '/app/local-resources/modules'

export interface LocationResult {
  slotName: string
  moduleModel?: ModuleModel
  adapterName?: string
}

interface BaseParams {
  location: LabwareLocation | null
  loadedModules: LoadedModules
  loadedLabwares: LoadedLabwares
  robotType: RobotType
}

export interface LocationSlotOnlyParams extends BaseParams {
  detailLevel: 'slot-only'
}

export interface LocationFullParams extends BaseParams {
  allRunDefs: LabwareDefinition2[]
  detailLevel?: 'full'
}

export type GetLabwareLocationParams =
  | LocationSlotOnlyParams
  | LocationFullParams

// detailLevel returns additional information about the module and adapter in the same location, if applicable.
// if 'slot-only', returns the underlying slot location.
export function getLabwareLocation(
  params: GetLabwareLocationParams
): LocationResult | null {
  const {
    loadedLabwares,
    loadedModules,
    location,
    detailLevel = 'full',
  } = params

  if (location == null) {
    return null
  } else if (location === 'offDeck') {
    return { slotName: 'offDeck' }
  } else if ('slotName' in location) {
    return { slotName: location.slotName }
  } else if ('addressableAreaName' in location) {
    return { slotName: location.addressableAreaName }
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModel(loadedModules, location.moduleId)
    if (moduleModel == null) {
      console.error('labware is located on an unknown module model')
      return null
    }
    const slotName = getModuleDisplayLocation(loadedModules, location.moduleId)

    return {
      slotName,
      moduleModel,
    }
  } else if ('labwareId' in location) {
    if (!Array.isArray(loadedLabwares)) {
      console.error('Cannot get location from loaded labwares object')
      return null
    }

    const adapter = loadedLabwares.find(lw => lw.id === location.labwareId)

    if (adapter == null) {
      console.error('labware is located on an unknown adapter')
      return null
    } else if (detailLevel === 'slot-only') {
      return getLabwareLocation({
        ...params,
        location: adapter.location,
      })
    } else if (detailLevel === 'full') {
      const { allRunDefs } = params as LocationFullParams
      const adapterDef = allRunDefs.find(
        def => getLabwareDefURI(def) === adapter?.definitionUri
      )
      const adapterName =
        adapterDef != null ? getLabwareDisplayName(adapterDef) : ''

      if (adapter.location === 'offDeck') {
        return { slotName: 'offDeck', adapterName }
      } else if (
        'slotName' in adapter.location ||
        'addressableAreaName' in adapter.location
      ) {
        const slotName =
          'slotName' in adapter.location
            ? adapter.location.slotName
            : adapter.location.addressableAreaName
        return { slotName, adapterName }
      } else if ('moduleId' in adapter.location) {
        const moduleIdUnderAdapter = adapter.location.moduleId

        if (!Array.isArray(loadedModules)) {
          console.error('Cannot get location from loaded modules object')
          return null
        }

        const moduleModel = loadedModules.find(
          module => module.id === moduleIdUnderAdapter
        )?.model

        if (moduleModel == null) {
          console.error('labware is located on an adapter on an unknown module')
          return null
        }

        const slotName = getModuleDisplayLocation(
          loadedModules,
          adapter.location.moduleId
        )

        return {
          slotName,
          moduleModel,
          adapterName,
        }
      } else if ('labwareId' in adapter.location) {
        return getLabwareLocation({
          ...params,
          location: adapter.location,
        })
      } else {
        return null
      }
    } else {
      console.error('Unhandled detailLevel.')
      return null
    }
  } else {
    return null
  }
}
