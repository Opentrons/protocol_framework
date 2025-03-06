import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  StyledText,
  SPACING,
  COLORS,
  ListButton,
  TextListTableContent,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  Icon,
} from '@opentrons/components'

import {
  selectAllLabwareInfo,
  setSelectedLabwareUri,
  selectIsMissingDefaultOffsetForLw,
  selectCountLocationSpecificOffsetsForLw,
} from '/app/redux/protocol-runs'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import type { LabwareDetails } from '/app/redux/protocol-runs'

export function LPCLabwareList(props: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const labwareInfo = useSelector(selectAllLabwareInfo(props.runId))

  return (
    <TextListTableContent header={t('select_labware_to_view_data')}>
      {Object.entries(labwareInfo).map(([uri, info]) => (
        <LabwareItem key={`labware_${uri}`} uri={uri} info={info} {...props} />
      ))}
      {/* Accommodate scrolling. */}
      <Flex height={SPACING.spacing40} />
    </TextListTableContent>
  )
}

interface LabwareItemProps extends LPCWizardContentProps {
  uri: string
  info: LabwareDetails
}

function LabwareItem({ uri, info, runId }: LabwareItemProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const dispatch = useDispatch()
  const isMissingDefaultOffset = useSelector(
    selectIsMissingDefaultOffsetForLw(runId, uri)
  )
  const countLocationSpecificOffsets = useSelector(
    selectCountLocationSpecificOffsetsForLw(runId, uri)
  )

  const handleOnClick = (): void => {
    dispatch(setSelectedLabwareUri(runId, uri))
  }

  const getOffsetCopy = (): string => {
    if (countLocationSpecificOffsets > 1) {
      return isMissingDefaultOffset
        ? t('num_missing_offsets', { num: countLocationSpecificOffsets })
        : t('num_offsets', { num: countLocationSpecificOffsets })
    } else {
      return isMissingDefaultOffset ? t('one_missing_offset') : t('one_offset')
    }
  }

  return (
    <ListButton
      type={isMissingDefaultOffset ? 'notConnected' : 'noActive'}
      onClick={handleOnClick}
      width="100%"
    >
      <Flex css={CONTENT_CONTAINER_STYLE}>
        <Flex css={TEXT_CONTAINER_STYLE}>
          <StyledText oddStyle="level4HeaderSemiBold">
            {info.displayName}
          </StyledText>
          <StyledText oddStyle="bodyTextRegular" css={SUBTEXT_STYLE}>
            {getOffsetCopy()}
          </StyledText>
        </Flex>
        <Icon name="chevron-right" css={ICON_STYLE} />
      </Flex>
    </ListButton>
  )
}

const CONTENT_CONTAINER_STYLE = css`
  width: 100%;
  grid-gap: ${SPACING.spacing24};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const TEXT_CONTAINER_STYLE = css`
  width: 100%;
  flex-grow: 1;
  gap: ${SPACING.spacing16};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const SUBTEXT_STYLE = css`
  color: ${COLORS.grey60};
`

const ICON_STYLE = css`
  width: ${SPACING.spacing48};
  height: ${SPACING.spacing48};
`
