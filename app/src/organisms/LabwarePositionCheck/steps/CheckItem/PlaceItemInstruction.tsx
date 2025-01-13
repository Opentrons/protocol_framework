import { Trans, useTranslation } from 'react-i18next'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { TYPOGRAPHY, LegacyStyledText } from '@opentrons/components'

import {
  selectActiveAdapterDisplayName,
  selectLwDisplayName,
} from '/app/organisms/LabwarePositionCheck/redux'
import { getLabwareDisplayLocation } from '/app/local-resources/labware'

import type {
  CheckPositionsStep,
  LPCStepProps,
} from '/app/organisms/LabwarePositionCheck/types'

interface PlaceItemInstructionProps extends LPCStepProps<CheckPositionsStep> {
  isLwTiprack: boolean
  slotOnlyDisplayLocation: string
}

export function PlaceItemInstruction({
  step,
  isLwTiprack,
  slotOnlyDisplayLocation,
  state,
}: PlaceItemInstructionProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { protocolData, labwareDefs } = state
  const { location, adapterId } = step

  const labwareDisplayName = selectLwDisplayName(state)
  const adapterDisplayName = selectActiveAdapterDisplayName(state)
  const displayLocation = getLabwareDisplayLocation({
    location,
    allRunDefs: labwareDefs,
    detailLevel: 'full',
    t,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
  })

  if (isLwTiprack) {
    return (
      <Trans
        t={t}
        i18nKey="place_a_full_tip_rack_in_location"
        tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
        components={{
          bold: (
            <LegacyStyledText
              as="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  } else if (adapterId != null) {
    return (
      <Trans
        t={t}
        i18nKey="place_labware_in_adapter_in_location"
        tOptions={{
          adapter: adapterDisplayName,
          labware: labwareDisplayName,
          location: slotOnlyDisplayLocation,
        }}
        components={{
          bold: (
            <LegacyStyledText
              as="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  } else {
    return (
      <Trans
        t={t}
        i18nKey="place_labware_in_location"
        tOptions={{ labware: labwareDisplayName, location: displayLocation }}
        components={{
          bold: (
            <LegacyStyledText
              as="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  }
}
