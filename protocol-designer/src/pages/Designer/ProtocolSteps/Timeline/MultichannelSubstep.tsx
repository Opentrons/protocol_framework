import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DeckInfoLabel,
  Flex,
  ListButton,
  NO_WRAP,
  SPACING,
  StyledText,
  Tag,
  WRAP,
} from '@opentrons/components'
import { Substep } from './Substep'
import { formatVolume } from './utils'
import type { AdditionalEquipmentName } from '@opentrons/step-generation'
import type {
  StepItemSourceDestRow,
  SubstepIdentifier,
} from '../../../../steplist'
import { values } from 'lodash'

interface MultichannelSubstepProps {
  trashName: AdditionalEquipmentName | null
  rowGroup: StepItemSourceDestRow[]
  stepId: string
  substepIndex: number
  selectSubstep: (substepIdentifier: SubstepIdentifier) => void
  highlighted?: boolean
  isSameLabware?: boolean
}

export function MultichannelSubstep(
  props: MultichannelSubstepProps
): JSX.Element {
  const {
    rowGroup,
    stepId,
    selectSubstep,
    substepIndex,
    trashName,
    isSameLabware,
  } = props
  const { t } = useTranslation('application')
  const [collapsed, setCollapsed] = useState<Boolean>(true)
  const handleToggleCollapsed = (): void => {
    setCollapsed(!collapsed)
  }

  const firstChannelSource = rowGroup[0].source
  const lastChannelSource = rowGroup[rowGroup.length - 1].source
  const sourceWellRange = `${
    firstChannelSource ? firstChannelSource.well : ''
  }:${lastChannelSource ? lastChannelSource.well : ''}`
  const firstChannelDest = rowGroup[0].dest
  const lastChannelDest = rowGroup[rowGroup.length - 1].dest
  const destWellRange = `${
    firstChannelDest ? firstChannelDest.well ?? 'Trash' : ''
  }:${lastChannelDest ? lastChannelDest.well : ''}`

  interface MultiChannelSubstepButtonProps {
    tagText: string
    sources: JSX.Element | null
    destinations: JSX.Element | null
  }

  function MultiChannelSubstepButton(
    props: MultiChannelSubstepButtonProps
  ): JSX.Element {
    const { tagText, sources, destinations } = props
    const { t } = useTranslation('protocol_steps')
    return (
      <Flex
        gridGap={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
        flexWrap={WRAP}
      >
        <Trans
          t={t}
          i18nKey="move_liquid.substeps.multi"
          components={{
            text: (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                style={{ whiteSpace: NO_WRAP }}
              />
            ),
            tag: <Tag type="default" text={tagText} />,
            label1: sources ?? <></>,
            label2: destinations ?? <></>,
          }}
          values={values}
        />
      </Flex>
    )
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      width="100%"
      onMouseEnter={() => {
        selectSubstep({ stepId, substepIndex })
      }}
      onMouseLeave={() => {
        selectSubstep(null)
      }}
    >
      {/* TODO: need to update this to match designs! */}
      <ListButton
        type="noActive"
        onClick={handleToggleCollapsed}
        padding={SPACING.spacing16}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {/* replace below Flex with custom component */}
          <MultiChannelSubstepButton
            tagText={`${formatVolume(rowGroup[0].volume)} ${t(
              'units.microliter'
            )}`}
            sources={
              firstChannelSource != null ? (
                <DeckInfoLabel deckLabel={sourceWellRange} />
              ) : null
            }
            destinations={
              firstChannelDest != null ? (
                <DeckInfoLabel deckLabel={destWellRange} />
              ) : null
            }
          />
          {!collapsed ? (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {rowGroup.map((row, rowKey) => {
                return (
                  <Substep
                    trashName={trashName}
                    key={rowKey}
                    volume={row.volume}
                    source={row.source}
                    dest={row.dest}
                    stepId={stepId}
                    substepIndex={substepIndex}
                    isSameLabware={isSameLabware}
                  />
                )
              })}
            </Flex>
          ) : null}
        </Flex>
      </ListButton>
    </Flex>
  )
}
