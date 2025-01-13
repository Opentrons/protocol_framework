import { useMemo } from 'react'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_AUTO,
  PrimaryButton,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import { PythonLabwareOffsetSnippet } from '/app/molecules/PythonLabwareOffsetSnippet'
import { getIsLabwareOffsetCodeSnippetsOn } from '/app/redux/config'
import { SmallButton } from '/app/atoms/buttons'
import { LabwareOffsetTabs } from '/app/organisms/LabwareOffsetTabs'
import { getCurrentOffsetForLabwareInLocation } from '/app/transformations/analysis'
import { TableComponent } from './TableComponent'

import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type {
  LPCStepProps,
  ResultsSummaryStep,
} from '/app/organisms/LabwarePositionCheck/types'

// TODO(jh, 01-08-25): This support link will likely need updating as a part of RPRD-173, too.
const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

export function ResultsSummary(
  props: LPCStepProps<ResultsSummaryStep>
): JSX.Element {
  const { existingOffsets, commandUtils, state } = props
  const { protocolData, isOnDevice, workingOffsets } = state
  const { isApplyingOffsets, handleApplyOffsets } = commandUtils
  const { i18n, t } = useTranslation('labware_position_check')
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )

  // TOME: TODO: I believe this should be in a utility fn.
  //  The one tricky thing here is handling the error, because you want to bubble this.
  //  Just make this a command AND a selector. You have access to state.
  const offsetsToApply = useMemo(() => {
    return workingOffsets.map<LabwareOffsetCreateData>(
      ({ initialPosition, finalPosition, labwareId, location }) => {
        const definitionUri =
          protocolData.labware.find(l => l.id === labwareId)?.definitionUri ??
          null
        if (
          finalPosition == null ||
          initialPosition == null ||
          definitionUri == null
        ) {
          throw new Error(
            `cannot create offset for labware with id ${labwareId}, in location ${JSON.stringify(
              location
            )}, with initial position ${String(
              initialPosition
            )}, and final position ${String(finalPosition)}`
          )
        }

        const existingOffset =
          getCurrentOffsetForLabwareInLocation(
            existingOffsets,
            definitionUri,
            location
          )?.vector ?? IDENTITY_VECTOR
        const vector = getVectorSum(
          existingOffset,
          getVectorDifference(finalPosition, initialPosition)
        )
        return { definitionUri, location, vector }
      }
    )
  }, [workingOffsets])

  return (
    <Flex css={PARENT_CONTAINER_STYLE}>
      <Flex css={SHARED_CONTAINER_STYLE}>
        <Header>{t('new_labware_offset_data')}</Header>
        {isLabwareOffsetCodeSnippetsOn ? (
          <LabwareOffsetTabs
            TableComponent={
              <TableComponent offsetsToApply={offsetsToApply} {...props} />
            }
            JupyterComponent={
              <PythonLabwareOffsetSnippet
                mode="jupyter"
                labwareOffsets={offsetsToApply}
                commands={protocolData?.commands ?? []}
                labware={protocolData?.labware ?? []}
                modules={protocolData?.modules ?? []}
              />
            }
            CommandLineComponent={
              <PythonLabwareOffsetSnippet
                mode="cli"
                labwareOffsets={offsetsToApply}
                commands={protocolData?.commands ?? []}
                labware={protocolData?.labware ?? []}
                modules={protocolData?.modules ?? []}
              />
            }
            marginTop={SPACING.spacing16}
          />
        ) : (
          <TableComponent offsetsToApply={offsetsToApply} {...props} />
        )}
      </Flex>
      {isOnDevice ? (
        <SmallButton
          alignSelf={ALIGN_FLEX_END}
          onClick={() => {
            handleApplyOffsets(offsetsToApply)
          }}
          buttonText={i18n.format(t('apply_offsets'), 'capitalize')}
          iconName={isApplyingOffsets ? 'ot-spinner' : null}
          iconPlacement={isApplyingOffsets ? 'startIcon' : null}
          disabled={isApplyingOffsets}
        />
      ) : (
        <Flex css={DESKTOP_BUTTON_STYLE}>
          <NeedHelpLink href={LPC_HELP_LINK_URL} />
          <PrimaryButton
            onClick={() => {
              handleApplyOffsets(offsetsToApply)
            }}
            disabled={isApplyingOffsets}
          >
            <Flex>
              {isApplyingOffsets ? (
                <Icon
                  size="1rem"
                  spin
                  name="ot-spinner"
                  marginRight={SPACING.spacing8}
                />
              ) : null}
              <LegacyStyledText>
                {i18n.format(t('apply_offsets'), 'capitalize')}
              </LegacyStyledText>
            </Flex>
          </PrimaryButton>
        </Flex>
      )}
    </Flex>
  )
}

const PARENT_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: ${SPACING.spacing32};
  min-height: 29.5rem;
`

const SHARED_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  max-height: 20rem;
  overflow-y: ${OVERFLOW_AUTO};

  &::-webkit-scrollbar {
    width: 0.75rem;
    background-color: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${COLORS.grey50};
    border-radius: 11px;
  }
`

const DESKTOP_BUTTON_STYLE = css`
  width: 100%;
  margin-top: ${SPACING.spacing32};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`
