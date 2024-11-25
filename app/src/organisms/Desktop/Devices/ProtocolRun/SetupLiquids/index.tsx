import { useTranslation } from 'react-i18next'
import {
  JUSTIFY_CENTER,
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  PrimaryButton,
  useHoverTooltip,
  Tooltip,
} from '@opentrons/components'
import { useToggleGroup } from '/app/molecules/ToggleGroup/useToggleGroup'
import { ANALYTICS_LIQUID_SETUP_VIEW_TOGGLE } from '/app/redux/analytics'
import { SetupLiquidsList } from './SetupLiquidsList'
import { SetupLiquidsMap } from './SetupLiquidsMap'
import { useRunHasStarted } from '/app/resources/runs'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

interface SetupLiquidsProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  isLiquidSetupConfirmed: boolean
  setLiquidSetupConfirmed: (confirmed: boolean) => void
  robotName: string
}

export function SetupLiquids({
  runId,
  protocolAnalysis,
  isLiquidSetupConfirmed,
  setLiquidSetupConfirmed,
  robotName,
}: SetupLiquidsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view') as string,
    t('map_view') as string,
    ANALYTICS_LIQUID_SETUP_VIEW_TOGGLE
  )

  // TODO(jh, 11-13-24): These disabled tooltips are used throughout setup flows. Let's consolidate them.
  const [targetProps, tooltipProps] = useHoverTooltip()
  const runHasStarted = useRunHasStarted(runId)
  const tooltipText = runHasStarted ? t('protocol_run_started') : null

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      marginTop={SPACING.spacing32}
      gridGap={SPACING.spacing16}
    >
      {toggleGroup}
      {selectedValue === t('list_view') ? (
        <SetupLiquidsList runId={runId} robotName={robotName} />
      ) : (
        <SetupLiquidsMap runId={runId} protocolAnalysis={protocolAnalysis} />
      )}
      <Flex alignSelf={ALIGN_CENTER}>
        <PrimaryButton
          onClick={() => {
            setLiquidSetupConfirmed(true)
          }}
          disabled={isLiquidSetupConfirmed || runHasStarted}
          {...targetProps}
        >
          {t('confirm_locations_and_volumes')}
        </PrimaryButton>
        {tooltipText != null ? (
          <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
        ) : null}
      </Flex>
    </Flex>
  )
}
