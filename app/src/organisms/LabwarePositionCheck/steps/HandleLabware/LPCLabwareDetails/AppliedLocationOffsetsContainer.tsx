import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  StyledText,
  ListButton,
  SPACING,
  getLabwareDisplayLocation,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  selectSelectedLabwareDisplayName,
  selectSelectedLabwareInfo,
  selectSelectedOffsetDetails,
  setSelectedLabware,
} from '/app/redux/protocol-runs'
import { InterventionInfo } from '/app/molecules/InterventionModal/InterventionContent'

import type { State } from '/app/redux/types'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import type {
  LPCWizardState,
  OffsetDetails,
  SelectedLabwareInfo,
} from '/app/redux/protocol-runs'

export function AppliedLocationOffsetsContainer(
  props: LPCWizardContentProps
): JSX.Element {
  const offsetDetails = useSelector(selectSelectedOffsetDetails(props.runId))

  return (
    <Flex css={APPLIED_LOCATION_CONTAINER_STYLE}>
      {offsetDetails.map(offset => (
        <LabwareLocationItemContainer
          key={`${offset.locationDetails.slotName}${offset.locationDetails.moduleId}${offset.locationDetails.adapterId}`}
          {...props}
          offsetDetail={offset}
        />
      ))}
    </Flex>
  )
}

interface LabwareLocationItemProps extends LPCWizardContentProps {
  offsetDetail: OffsetDetails
}

function LabwareLocationItemContainer(
  props: LabwareLocationItemProps
): JSX.Element {
  const { t } = useTranslation('labware_position_check')

  return (
    <Flex css={LOCATION_ITEM_CONTAINER_STYLE}>
      <Flex css={HEADER_STYLE}>
        <StyledText>{t('slot_location')}</StyledText>
        <StyledText>{t('offsets')}</StyledText>
      </Flex>
      <LabwareLocationItem {...props} />
      {/* Gives extra scrollable space. */}
      <Flex css={BOX_STYLE} />
    </Flex>
  )
}

function LabwareLocationItem({
  runId,
  offsetDetail,
}: LabwareLocationItemProps): JSX.Element {
  const { t: commandTextT } = useTranslation('protocol_command_text')
  const dispatch = useDispatch()

  const { protocolData } = useSelector(
    (state: State) => state.protocolRuns[runId]?.lpc as LPCWizardState
  )
  const displayName = useSelector(selectSelectedLabwareDisplayName(runId))
  const selectedLw = useSelector(
    selectSelectedLabwareInfo(runId)
  ) as SelectedLabwareInfo

  const slotCopy = getLabwareDisplayLocation({
    t: commandTextT,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
    location: { slotName: offsetDetail.locationDetails.slotName },
    detailLevel: 'slot-only',
  })

  const handleOnClick = (): void => {
    dispatch(
      setSelectedLabware(runId, selectedLw.uri, offsetDetail.locationDetails)
    )
  }

  return (
    <ListButton type="noActive" onClick={handleOnClick}>
      <Flex css={BUTTON_TEXT_STYLE}>
        <InterventionInfo
          type="location"
          labwareName={displayName}
          currentLocationProps={{ deckLabel: slotCopy }}
        />
      </Flex>
    </ListButton>
  )
}

const APPLIED_LOCATION_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing24};
`

const HEADER_STYLE = css`
  padding: 0 1.375rem;
  grid-gap: 3.813rem;
`

const LOCATION_ITEM_CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing8};
`

const BUTTON_TEXT_STYLE = css`
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
`

const BOX_STYLE = css`
  height: ${SPACING.spacing40};
`
