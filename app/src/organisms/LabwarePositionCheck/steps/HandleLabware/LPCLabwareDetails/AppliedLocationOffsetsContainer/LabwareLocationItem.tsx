import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  DeckInfoLabel,
  MODULE_ICON_NAME_BY_TYPE,
  COLORS,
  BORDERS,
} from '@opentrons/components'
import { getModuleType } from '@opentrons/shared-data'

import {
  selectIsMissingDefaultOffsetForLw,
  selectSelectedLabwareInfo,
  selectSelectedLwLocationSpecificOffsetInitialPosition,
  setFinalPosition,
  setSelectedLabware,
} from '/app/redux/protocol-runs'
import { OffsetTag } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/OffsetTag'
import { MultiDeckLabelTagBtns } from '/app/molecules/MultiDeckLabelTagBtns'

import type { ModuleType } from '@opentrons/shared-data'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import type {
  LocationSpecificOffsetDetails,
  SelectedLabwareInfo,
} from '/app/redux/protocol-runs'
import type { OffsetTagProps } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/OffsetTag'

interface LabwareLocationItemProps extends LPCWizardContentProps {
  locationSpecificOffsetDetails: LocationSpecificOffsetDetails
  slotCopy: string
}

export function LabwareLocationItem({
  runId,
  locationSpecificOffsetDetails,
  commandUtils,
  slotCopy,
}: LabwareLocationItemProps): JSX.Element {
  const { t: lpcTextT } = useTranslation('labware_position_check')
  const { toggleRobotMoving, handleCheckItemsPrepModules } = commandUtils
  const dispatch = useDispatch()

  const selectedLw = useSelector(
    selectSelectedLabwareInfo(runId)
  ) as SelectedLabwareInfo
  const initialPosition = useSelector(
    selectSelectedLwLocationSpecificOffsetInitialPosition(runId)
  )
  const isMissingDefaultOffset = useSelector(
    selectIsMissingDefaultOffsetForLw(
      runId,
      locationSpecificOffsetDetails.locationDetails.definitionUri
    )
  )

  // TOME TODO: Make sure the offset tag shows the working offset if it exists. You'll
  //  probably want edit flows to start at the working offset position, too. This means
  //  you will want logic to convert the working offset into a VectorOffset. This also applies to
  //  the default offset!

  const handleLaunchEditOffset = (): void => {
    void toggleRobotMoving(true)
      .then(() => {
        dispatch(
          setSelectedLabware(
            runId,
            selectedLw.uri,
            locationSpecificOffsetDetails.locationDetails
          )
        )
      })
      .then(() =>
        handleCheckItemsPrepModules(
          locationSpecificOffsetDetails.locationDetails,
          initialPosition
        )
      )
      .finally(() => toggleRobotMoving(false))
  }

  const handleResetOffset = (): void => {
    dispatch(
      setFinalPosition(runId, {
        location: locationSpecificOffsetDetails.locationDetails,
        position: null,
        labwareUri: locationSpecificOffsetDetails.locationDetails.definitionUri,
      })
    )
  }

  const buildOffsetTagProps = (): OffsetTagProps => {
    if (isMissingDefaultOffset) {
      return { kind: 'noOffset' }
    } else if (locationSpecificOffsetDetails.existingOffset == null) {
      return { kind: 'default' }
    } else {
      const { vector } = locationSpecificOffsetDetails.existingOffset

      return { kind: 'vector', ...vector }
    }
  }

  // TODO(jh, 03-06-25): Add the stacked label after integrating the new API work.
  //  Note that it is the same as the Flex stacker module type.
  const buildDeckInfoLabels = (): JSX.Element[] => {
    const moduleIconType = (): ModuleType | null => {
      const moduleModel =
        locationSpecificOffsetDetails.locationDetails.moduleModel

      if (moduleModel != null) {
        return getModuleType(moduleModel)
      } else {
        return null
      }
    }

    const deckInfoLabels = [
      <DeckInfoLabel deckLabel={slotCopy} key={slotCopy} />,
    ]

    const moduleType = moduleIconType()
    if (moduleType !== null) {
      deckInfoLabels.push(
        <DeckInfoLabel
          iconName={MODULE_ICON_NAME_BY_TYPE[moduleType]}
          key="module-icon"
        />
      )
    }

    return deckInfoLabels
  }

  return (
    <Flex css={DECK_LABEL_CONTAINER_STYLE}>
      <MultiDeckLabelTagBtns
        colOneDeckInfoLabels={buildDeckInfoLabels()}
        colTwoTag={<OffsetTag {...buildOffsetTagProps()} />}
        colThreePrimaryBtn={{
          buttonText: lpcTextT('adjust'),
          onClick: handleLaunchEditOffset,
          buttonType: 'secondary',
          disabled: isMissingDefaultOffset,
        }}
        colThreeSecondaryBtn={{
          buttonText: lpcTextT('reset_to_default'),
          onClick: handleResetOffset,
          buttonType: 'tertiaryHighLight',
          disabled: isMissingDefaultOffset,
        }}
      />
    </Flex>
  )
}

const DECK_LABEL_CONTAINER_STYLE = css`
  background-color: ${COLORS.grey35};
  border-radius: ${BORDERS.borderRadius8};
`
