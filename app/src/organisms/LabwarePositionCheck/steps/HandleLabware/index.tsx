import { useSelector } from 'react-redux'

import {
  selectSelectedLabwareFlowType,
  selectSelectedLabwareInfo,
} from '/app/redux/protocol-runs'
import { CheckItem } from './CheckItem'
import { LPCLabwareList } from './LPCLabwareList'
import { LPCLabwareDetails } from './LPCLabwareDetails'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function HandleLabware(props: LPCWizardContentProps): JSX.Element {
  const selectedLw = useSelector(selectSelectedLabwareInfo(props.runId))
  const offsetFlowType = useSelector(selectSelectedLabwareFlowType(props.runId))

  // These routes are one step, since the progress bar remains static during the core LPC flow.
  if (selectedLw == null) {
    // The general labware list view.
    return <LPCLabwareList {...props} />
  } else if (selectedLw.offsetLocationDetails == null) {
    // The offset view for a singular labware geometry.
    return <LPCLabwareDetails {...props} />
  } else {
    // The core flow for updating an offset for a singular labware geometry.
    switch (offsetFlowType) {
      case 'default':
        return <CheckItem {...props} />
      case 'location-specific':
        return <CheckItem {...props} />
      default: {
        console.error(`Unexpected offsetFlowType: ${offsetFlowType}`)
        return <CheckItem {...props} />
      }
    }
  }
}
