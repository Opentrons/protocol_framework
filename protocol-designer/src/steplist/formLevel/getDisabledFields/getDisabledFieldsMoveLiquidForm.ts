import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import type { HydratedMoveLiquidFormData } from '../../../form-types'
// NOTE: expects that '_checkbox' fields are implemented so that
// when checkbox is disabled, its dependent fields are hidden
export function getDisabledFieldsMoveLiquidForm(
  hydratedForm: HydratedMoveLiquidFormData
): Set<string> {
  const disabled: Set<string> = new Set()
  const prefixes = ['aspirate', 'dispense']
  const { fields } = hydratedForm
  const isDispensingIntoTrash =
    'name' in fields.dispense_labware &&
    (fields.dispense_labware.name === 'wasteChute' ||
      fields.dispense_labware.name === 'trashBin')

  if (
    (fields.dispense_wells.length === 0 && !isDispensingIntoTrash) ||
    fields.aspirate_wells.length === 0 ||
    fields.pipette == null
  ) {
    disabled.add('pickUpTip_location')
    disabled.add('dropTip_location')
  }
  if (isDispensingIntoTrash) {
    disabled.add('dispense_mix_checkbox')
    disabled.add('dispense_touchTip_checkbox')
    disabled.add('dispense_mmFromBottom')
  }
  if (fields.path === 'multiAspirate') {
    disabled.add('aspirate_mix_checkbox')
  } else if (fields.path === 'multiDispense') {
    disabled.add('dispense_mix_checkbox')
    if (fields.disposalVolume_checkbox) {
      disabled.add('blowout_checkbox')
    }
  }
  if (
    'isTouchTipAllowed' in fields.dispense_labware &&
    !fields.dispense_labware?.isTouchTipAllowed
  ) {
    disabled.add('dispense_touchTip_checkbox')
  }
  if (
    'isTouchTipAllowed' in fields.aspirate_labware &&
    !fields.aspirate_labware?.isTouchTipAllowed
  ) {
    disabled.add('aspirate_touchTip_checkbox')
  }
  // fields which require a pipette & a corresponding labware to be selected
  prefixes.forEach(prefix => {
    //  @ts-expect-error for aspirate and dispense
    if (!fields.pipette || !fields[`${prefix}_labware`]) {
      disabled.add(`${prefix}_touchTip_checkbox`)
      disabled.add(`${prefix}_mmFromBottom`)
      disabled.add(`${prefix}_wells`)
    }
  })

  if (
    !fields.blowout_location ||
    fields.blowout_location.includes('wasteChute') ||
    fields.blowout_location.includes('trashBin') ||
    (fields.blowout_location === SOURCE_WELL_BLOWOUT_DESTINATION &&
      !fields.aspirate_labware) ||
    (fields.blowout_location === DEST_WELL_BLOWOUT_DESTINATION &&
      !fields.dispense_labware)
  ) {
    disabled.add('blowout_z_offset')
  }
  return disabled
}
