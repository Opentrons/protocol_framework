import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { TYPOGRAPHY, LegacyStyledText } from '@opentrons/components'

import {
  selectActiveAdapterDisplayName,
  selectLwDisplayName,
} from '/app/redux/protocol-runs'

import type { State } from '/app/redux/types'
import type {
  CheckPositionsStep,
  LPCStepProps,
} from '/app/organisms/LabwarePositionCheck/types'

interface PlaceItemInstructionProps extends LPCStepProps<CheckPositionsStep> {
  isLwTiprack: boolean
  slotOnlyDisplayLocation: string
  fullDisplayLocation: string
}

export function PlaceItemInstruction({
  runId,
  step,
  isLwTiprack,
  slotOnlyDisplayLocation,
  fullDisplayLocation,
}: PlaceItemInstructionProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { adapterId } = step

  const labwareDisplayName = useSelector((state: State) =>
    selectLwDisplayName(runId, state)
  )
  const adapterDisplayName = useSelector((state: State) =>
    selectActiveAdapterDisplayName(runId, state)
  )

  if (isLwTiprack) {
    return (
      <Trans
        t={t}
        i18nKey="place_a_full_tip_rack_in_location"
        tOptions={{
          tip_rack: labwareDisplayName,
          location: fullDisplayLocation,
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
        tOptions={{
          labware: labwareDisplayName,
          location: fullDisplayLocation,
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
  }
}
