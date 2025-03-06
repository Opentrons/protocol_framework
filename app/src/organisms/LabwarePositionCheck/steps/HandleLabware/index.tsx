import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  clearSelectedLabware,
  selectSelectedLabwareDisplayName,
  selectSelectedLabwareFlowType,
  selectSelectedLabwareInfo,
  selectWorkingOffsetsByUri,
} from '/app/redux/protocol-runs'
import { CheckItem } from './CheckItem'
import { LPCLabwareList } from './LPCLabwareList'
import { LPCLabwareDetails } from './LPCLabwareDetails'
import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function HandleLabware(props: LPCWizardContentProps): JSX.Element {
  return <HandleLabwareContent {...props} />
}

function HandleLabwareContent(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { runId } = props
  const dispatch = useDispatch()

  const selectedLw = useSelector(selectSelectedLabwareInfo(runId))
  const offsetFlowType = useSelector(selectSelectedLabwareFlowType(runId))
  const selectedLwName = useSelector(selectSelectedLabwareDisplayName(runId))
  const workingOffsetsByUri = useSelector(selectWorkingOffsetsByUri(runId))

  // These routes are one step, since the progress bar remains static during the core LPC flow.
  if (selectedLw == null) {
    // The general labware list view.
    return (
      <LPCContentContainer
        {...props}
        header={t('labware_position_check_title')}
        buttonText={t('exit')}
        onClickButton={props.commandUtils.headerCommands.handleNavToDetachProbe}
      >
        <LPCLabwareList {...props} />
      </LPCContentContainer>
    )
  } else if (selectedLw.offsetLocationDetails == null) {
    const onHeaderGoBack = (): void => {
      dispatch(clearSelectedLabware(runId))
    }

    // TODO(jh, 03-05-25): Add the "save" btn functionality when the API changes are introduced.

    // The offset view for a singular labware geometry.
    return (
      <LPCContentContainer
        {...props}
        header={selectedLwName}
        buttonText={t('save')}
        onClickButton={() => null}
        onClickBack={onHeaderGoBack}
        buttonIsDisabled={Object.keys(workingOffsetsByUri).length === 0}
      >
        <LPCLabwareDetails {...props} />
      </LPCContentContainer>
    )
  } else {
    // The core flow for updating an offset for a singular labware geometry.
    const getHeader = (): string => {
      switch (offsetFlowType) {
        case 'default':
        case 'location-specific':
        default: {
          console.error(`Unexpected offsetFlowType: ${offsetFlowType}`)
        }
      }
    }

    return (
      <LPCContentContainer
        {...props}
        header={t('labware_position_check_title')}
        buttonText={t('exit')}
        onClickButton={props.commandUtils.headerCommands.handleNavToDetachProbe}
      >
        <CheckItem {...props} />
      </LPCContentContainer>
    )
  }
}
