import { useMemo, Fragment } from 'react'
import styled, { css } from 'styled-components'
import { useSelector } from 'react-redux'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'

import {
  FLEX_ROBOT_TYPE,
  getLabwareDefURI,
  getLabwareDisplayName,
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
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
import {
  getIsLabwareOffsetCodeSnippetsOn,
  getIsOnDevice,
} from '/app/redux/config'
import { SmallButton } from '/app/atoms/buttons'
import { LabwareOffsetTabs } from '/app/organisms/LabwareOffsetTabs'
import { getCurrentOffsetForLabwareInLocation } from '/app/transformations/analysis'
import { getLabwareDisplayLocation } from '/app/local-resources/labware'
import { TerseOffsetTable } from '/app/organisms/TerseOffsetTable'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type { LPCStepProps, ResultsSummaryStep } from '../types'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

export function ResultsSummary(
  props: LPCStepProps<ResultsSummaryStep>
): JSX.Element {
  const {
    protocolData,
    state,
    existingOffsets,
    labwareDefs,
    commandUtils,
  } = props
  const { isApplyingOffsets, handleApplyOffsets } = commandUtils
  const { i18n, t } = useTranslation('labware_position_check')
  const { workingOffsets } = state

  const isSubmittingAndClosing = isApplyingOffsets
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    getIsLabwareOffsetCodeSnippetsOn
  )

  // TOME TODO: This should be a global prop.
  const isOnDevice = useSelector(getIsOnDevice)

  // TOME: TODO: I believe this should be in a selector.
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

  const TableComponent = isOnDevice ? (
    <TerseOffsetTable
      offsets={offsetsToApply}
      labwareDefinitions={labwareDefs}
    />
  ) : (
    <OffsetTable
      offsets={offsetsToApply}
      labwareDefinitions={labwareDefs}
      {...props}
    />
  )
  const JupyterSnippet = (
    <PythonLabwareOffsetSnippet
      mode="jupyter"
      labwareOffsets={offsetsToApply}
      commands={protocolData?.commands ?? []}
      labware={protocolData?.labware ?? []}
      modules={protocolData?.modules ?? []}
    />
  )
  const CommandLineSnippet = (
    <PythonLabwareOffsetSnippet
      mode="cli"
      labwareOffsets={offsetsToApply}
      commands={protocolData?.commands ?? []}
      labware={protocolData?.labware ?? []}
      modules={protocolData?.modules ?? []}
    />
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        maxHeight="20rem"
        css={css`
          overflow-y: ${OVERFLOW_AUTO};
          &::-webkit-scrollbar {
            width: 0.75rem;
            background-color: transparent;
          }
          &::-webkit-scrollbar-thumb {
            background: ${COLORS.grey50};
            border-radius: 11px;
          }
        `}
      >
        <Header>{t('new_labware_offset_data')}</Header>
        {isLabwareOffsetCodeSnippetsOn ? (
          <LabwareOffsetTabs
            TableComponent={TableComponent}
            JupyterComponent={JupyterSnippet}
            CommandLineComponent={CommandLineSnippet}
            marginTop={SPACING.spacing16}
          />
        ) : (
          TableComponent
        )}
      </Flex>
      {isOnDevice ? (
        <SmallButton
          alignSelf={ALIGN_FLEX_END}
          onClick={() => {
            handleApplyOffsets(offsetsToApply)
          }}
          buttonText={i18n.format(t('apply_offsets'), 'capitalize')}
          iconName={isSubmittingAndClosing ? 'ot-spinner' : null}
          iconPlacement={isSubmittingAndClosing ? 'startIcon' : null}
          disabled={isSubmittingAndClosing}
        />
      ) : (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <NeedHelpLink href={LPC_HELP_LINK_URL} />
          <PrimaryButton
            onClick={() => {
              handleApplyOffsets(offsetsToApply)
            }}
            disabled={isSubmittingAndClosing}
          >
            <Flex>
              {isSubmittingAndClosing ? (
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

const Table = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing4};
  margin: ${SPACING.spacing16} 0;
  text-align: left;
`
const TableHeader = styled('th')`
  text-transform: ${TYPOGRAPHY.textTransformUppercase};
  color: ${COLORS.black90};
  font-weight: ${TYPOGRAPHY.fontWeightRegular};
  font-size: ${TYPOGRAPHY.fontSizeCaption};
  padding: ${SPACING.spacing4};
`
const TableRow = styled('tr')`
  background-color: ${COLORS.grey20};
`

const TableDatum = styled('td')`
  padding: ${SPACING.spacing4};
  white-space: break-spaces;
  text-overflow: wrap;
`

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

interface OffsetTableProps extends LPCStepProps<ResultsSummaryStep> {
  offsets: LabwareOffsetCreateData[]
  labwareDefinitions: LabwareDefinition2[]
}

const OffsetTable = ({
  offsets,
  labwareDefinitions,
  protocolData,
}: OffsetTableProps): JSX.Element => {
  const { t } = useTranslation('labware_position_check')

  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>{t('location')}</TableHeader>
          <TableHeader>{t('labware')}</TableHeader>
          <TableHeader>{t('labware_offset_data')}</TableHeader>
        </tr>
      </thead>

      <tbody>
        {offsets.map(({ location, definitionUri, vector }, index) => {
          const displayLocation = getLabwareDisplayLocation({
            location,
            allRunDefs: labwareDefinitions,
            detailLevel: 'full',
            t,
            loadedModules: protocolData.modules,
            loadedLabwares: protocolData.labware,
            robotType: FLEX_ROBOT_TYPE,
          })

          const labwareDef = labwareDefinitions.find(
            def => getLabwareDefURI(def) === definitionUri
          )
          const labwareDisplayName =
            labwareDef != null ? getLabwareDisplayName(labwareDef) : ''

          return (
            <TableRow key={index}>
              <TableDatum
                css={`
                  border-radius: ${BORDERS.borderRadius4} 0 0
                    ${BORDERS.borderRadius4};
                `}
              >
                <LegacyStyledText
                  as="p"
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                >
                  {displayLocation}
                </LegacyStyledText>
              </TableDatum>
              <TableDatum>
                <LegacyStyledText as="p">{labwareDisplayName}</LegacyStyledText>
              </TableDatum>
              <TableDatum
                css={`
                  border-radius: 0 ${BORDERS.borderRadius4}
                    ${BORDERS.borderRadius4} 0;
                `}
              >
                {isEqual(vector, IDENTITY_VECTOR) ? (
                  <LegacyStyledText>{t('no_labware_offsets')}</LegacyStyledText>
                ) : (
                  <Flex>
                    {[vector.x, vector.y, vector.z].map((axis, index) => (
                      <Fragment key={index}>
                        <LegacyStyledText
                          as="p"
                          marginLeft={index > 0 ? SPACING.spacing8 : 0}
                          marginRight={SPACING.spacing4}
                          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                        >
                          {['X', 'Y', 'Z'][index]}
                        </LegacyStyledText>
                        <LegacyStyledText as="p">
                          {axis.toFixed(1)}
                        </LegacyStyledText>
                      </Fragment>
                    ))}
                  </Flex>
                )}
              </TableDatum>
            </TableRow>
          )
        })}
      </tbody>
    </Table>
  )
}
