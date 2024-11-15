import {
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'
import { getLabwareLocation } from './getLabwareLocation'

import type { TFunction } from 'i18next'
import type {
  LocationSlotOnlyParams,
  LocationFullParams,
} from './getLabwareLocation'

export interface DisplayLocationSlotOnlyParams extends LocationSlotOnlyParams {
  t: TFunction
  isOnDevice?: boolean
}

export interface DisplayLocationFullParams extends LocationFullParams {
  t: TFunction
  isOnDevice?: boolean
}

export type DisplayLocationParams =
  | DisplayLocationSlotOnlyParams
  | DisplayLocationFullParams

// detailLevel applies to nested labware. If 'full', return copy that includes the actual peripheral that nests the
// labware, ex, "in module XYZ in slot C1".
// If 'slot-only', return only the slot name, ex "in slot C1".
export function getLabwareDisplayLocation(
  params: DisplayLocationParams
): string {
  const { t, isOnDevice = false } = params
  const locationResult = getLabwareLocation(params)

  if (locationResult == null) {
    return ''
  }

  const { slotName, moduleModel, adapterName } = locationResult

  if (slotName === 'offDeck') {
    return t('off_deck')
  }
  // Simple slot location
  else if (moduleModel == null && adapterName == null) {
    return isOnDevice ? slotName : t('slot', { slot_name: slotName })
  }
  // Module location without adapter
  else if (moduleModel != null && adapterName == null) {
    if (params.detailLevel === 'slot-only') {
      return moduleModel === THERMOCYCLER_MODULE_V1 ||
        moduleModel === THERMOCYCLER_MODULE_V2
        ? t('slot', { slot_name: 'A1+B1' })
        : t('slot', { slot_name: slotName })
    } else {
      return isOnDevice
        ? `${getModuleDisplayName(moduleModel)}, ${slotName}`
        : t('module_in_slot', {
            count: getOccludedSlotCountForModule(
              getModuleType(moduleModel),
              params.robotType
            ),
            module: getModuleDisplayName(moduleModel),
            slot_name: slotName,
          })
    }
  }
  // Adapter locations
  else if (adapterName != null) {
    if (moduleModel == null) {
      return t('adapter_in_slot', {
        adapter: adapterName,
        slot: slotName,
      })
    } else {
      return t('adapter_in_mod_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          params.robotType
        ),
        module: getModuleDisplayName(moduleModel),
        adapter: adapterName,
        slot: slotName,
      })
    }
  } else {
    return ''
  }
}
