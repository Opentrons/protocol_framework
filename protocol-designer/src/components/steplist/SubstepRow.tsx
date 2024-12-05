import { memo, Fragment } from 'react'
import { useSelector } from 'react-redux'
import map from 'lodash/map'
import noop from 'lodash/noop'
import reduce from 'lodash/reduce'
import omitBy from 'lodash/omitBy'
import { LegacyTooltip, useHoverTooltip } from '@opentrons/components'
import { selectors } from '../../labware-ingred/selectors'
import { IngredPill } from './IngredPill'
import { PDListItem } from '../lists'
import { swatchColors } from '../swatchColors'
import { formatVolume, formatPercentage } from './utils'
import styles from './StepItem.module.css'
import type { LocationLiquidState } from '@opentrons/step-generation'
import type {
  SubstepIdentifier,
  SubstepWellData,
  WellIngredientVolumeData,
  WellIngredientNames,
} from '../../steplist/types'

interface SubstepRowProps {
  volume: number | string | null | undefined
  source?: SubstepWellData
  dest?: SubstepWellData
  ingredNames: WellIngredientNames
  className?: string
  stepId: string
  substepIndex: number
  selectSubstep?: (substepIdentifier: SubstepIdentifier) => unknown
}

interface PillTooltipContentsProps {
  ingreds: WellIngredientVolumeData | LocationLiquidState
  ingredNames: WellIngredientNames
  well: string
}

export const PillTooltipContents = (
  props: PillTooltipContentsProps
): JSX.Element => {
  const { ingreds, ingredNames, well } = props
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const isSingleChannel = (ingred: any): ingred is { volume: number } =>
    typeof ingred === 'object' && 'volume' in ingred

  const isMultiChannel = (
    ingred: any
  ): ingred is { [ingredId: string]: { volume: number } } =>
    typeof ingred === 'object' && !('volume' in ingred)

  const totalLiquidVolume = reduce(
    ingreds,
    (acc, ingred) => {
      if (isSingleChannel(ingred)) {
        return acc + (ingred.volume ?? 0)
      } else if (isMultiChannel(ingred)) {
        return (
          acc +
          reduce(
            Object.values(ingred ?? {}),
            (subAcc, channelData) => subAcc + (channelData?.volume ?? 0),
            0
          )
        )
      }
      return acc
    },
    0
  )

  const hasMultipleIngreds = Object.keys(ingreds).length > 1

  return (
    <div className={styles.liquid_tooltip_contents}>
      <table>
        <tbody>
          {map(ingreds, (ingred, groupId) => {
            const volume = isSingleChannel(ingred)
              ? ingred.volume
              : reduce(
                  Object.values(ingred ?? {}),
                  (acc, channelData) => acc + (channelData?.volume ?? 0),
                  0
                )

            return (
              <tr key={groupId} className={styles.ingred_row}>
                <td>
                  <div
                    className={styles.liquid_circle}
                    style={{
                      backgroundColor:
                        liquidDisplayColors[Number(groupId)] ??
                        swatchColors(groupId),
                    }}
                  />
                </td>
                <td className={styles.ingred_name}>{ingredNames[groupId]}</td>
                {hasMultipleIngreds && (
                  <td className={styles.ingred_percentage}>
                    {formatPercentage(volume, totalLiquidVolume)}
                  </td>
                )}
                <td className={styles.ingred_partial_volume}>
                  {formatVolume(volume, 2)}µl
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {hasMultipleIngreds && (
        <Fragment>
          <div className={styles.total_divider} />
          <div className={styles.total_row}>
            <span>{`${well} Total Volume`}</span>
            <span>{formatVolume(totalLiquidVolume, 2)}µl</span>
          </div>
        </Fragment>
      )}
    </div>
  )
}

function SubstepRowComponent(props: SubstepRowProps): JSX.Element {
  const compactedSourcePreIngreds = props.source
    ? omitBy(
        props.source.preIngreds,
        // @ts-expect-error(sa, 2021-6-21): ingred.volume might be undefined
        ingred => typeof ingred.volume === 'number' && ingred.volume <= 0
      )
    : {}
  const compactedDestPreIngreds = props.dest
    ? omitBy(
        props.dest.preIngreds,
        // @ts-expect-error(sa, 2021-6-21): ingred.volume might be undefined
        ingred => typeof ingred.volume === 'number' && ingred.volume <= 0
      )
    : {}
  const selectSubstep = props.selectSubstep || noop

  const [sourceTargetProps, sourceTooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
  })
  const [destTargetProps, destTooltipProps] = useHoverTooltip({
    placement: 'bottom-end',
  })
  return (
    <>
      <LegacyTooltip {...sourceTooltipProps}>
        <PillTooltipContents
          well={props.source ? props.source.well : ''}
          ingredNames={props.ingredNames}
          ingreds={compactedSourcePreIngreds}
        />
      </LegacyTooltip>

      <LegacyTooltip {...destTooltipProps}>
        <PillTooltipContents
          well={props.dest ? props.dest.well : ''}
          ingredNames={props.ingredNames}
          ingreds={compactedDestPreIngreds}
        />
      </LegacyTooltip>
      <PDListItem
        border
        className={props.className}
        onMouseEnter={() => {
          selectSubstep({
            stepId: props.stepId,
            substepIndex: props.substepIndex,
          })
        }}
        onMouseLeave={() => {
          selectSubstep(null)
        }}
      >
        <IngredPill
          targetProps={sourceTargetProps}
          ingredNames={props.ingredNames}
          ingreds={compactedSourcePreIngreds}
        />

        <span
          className={styles.emphasized_cell}
          data-test="SubstepRow_aspirateWell"
        >
          {props.source && props.source.well}
        </span>
        <span className={styles.volume_cell} data-test="SubstepRow_volume">
          {`${formatVolume(props.volume)} μL`}
        </span>
        <span
          className={styles.emphasized_cell}
          data-test="SubstepRow_dispenseWell"
        >
          {props.dest && props.dest.well}
        </span>

        <IngredPill
          targetProps={destTargetProps}
          ingredNames={props.ingredNames}
          ingreds={compactedDestPreIngreds}
        />
      </PDListItem>
    </>
  )
}

export const SubstepRow = memo(SubstepRowComponent)
