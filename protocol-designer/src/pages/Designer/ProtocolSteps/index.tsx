import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  FLEX_MAX_CONTENT,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  Tag,
  ToggleGroup,
} from '@opentrons/components'
import {
  getSavedStepForms,
  getUnsavedForm,
} from '../../../step-forms/selectors'
import { getEnableHotKeysDisplay } from '../../../feature-flags/selectors'
import {
  getIsMultiSelectMode,
  getSelectedSubstep,
  getSelectedStepId,
  getHoveredStepId,
  getSelectedTerminalItemId,
  getHoveredTerminalItemId,
} from '../../../ui/steps/selectors'
import { DeckSetupContainer } from '../DeckSetup'
import { OffDeck } from '../Offdeck'
import { SubstepsToolbox } from './Timeline'
import { StepForm } from './StepForm'
import { StepSummary } from './StepSummary'
import { BatchEditToolbox } from './BatchEditToolbox'
import {
  getDesignerTab,
  getRobotStateTimeline,
} from '../../../file-data/selectors'
import { TimelineAlerts } from '../../../organisms'
import { DraggableSidebar } from './DraggableSidebar'

const CONTENT_MAX_WIDTH = '44.6704375rem'

export function ProtocolSteps(): JSX.Element {
  const { i18n, t } = useTranslation('starting_deck_state')
  const formData = useSelector(getUnsavedForm)
  const selectedTerminalItem = useSelector(getSelectedTerminalItemId)
  const hoveredTerminalItem = useSelector(getHoveredTerminalItemId)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selectedSubstep = useSelector(getSelectedSubstep)
  const enableHoyKeyDisplay = useSelector(getEnableHotKeysDisplay)
  const tab = useSelector(getDesignerTab)
  const leftString = t('onDeck')
  const rightString = t('offDeck')
  const [deckView, setDeckView] = useState<
    typeof leftString | typeof rightString
  >(leftString)
  const [targetWidth, setTargetWidth] = useState<number>(350)

  const currentHoveredStepId = useSelector(getHoveredStepId)
  const currentSelectedStepId = useSelector(getSelectedStepId)
  const currentstepIdForStepSummary =
    currentHoveredStepId ?? currentSelectedStepId
  const savedStepForms = useSelector(getSavedStepForms)
  const currentStep =
    currentstepIdForStepSummary != null
      ? savedStepForms[currentstepIdForStepSummary]
      : null

  const { errors: timelineErrors } = useSelector(getRobotStateTimeline)
  const hasTimelineErrors =
    timelineErrors != null ? timelineErrors.length > 0 : false
  const showTimelineAlerts =
    hasTimelineErrors && tab === 'protocolSteps' && formData == null
  const stepDetails = currentStep?.stepDetails ?? null

  console.log('targetWidth', targetWidth)
  return (
    <Flex
      backgroundColor={COLORS.grey10}
      height="calc(100vh - 4rem)"
      minHeight={FLEX_MAX_CONTENT}
      width="100%"
      padding={SPACING.spacing12}
      gridGap={SPACING.spacing16}
      // justifyContent={JUSTIFY_SPACE_BETWEEN}
      id="container for sidebar and main"
    >
      <Flex
        // width="100%"
        // minWidth="100%"
        flex="1"
        id="sidebar"
        css={css`
          outline: 1px solid red;
        `}
        height="100%"
      >
        <DraggableSidebar setTargetWidth={setTargetWidth} />
      </Flex>
      <Flex
        backgroundColor={COLORS.blue35}
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        flex="2.85"
        // width="82.3%"
        // maxWidth="100%"
        // minWidth="82.3%"
        // maxwidth={targetWidth === null ? '100%' : `calc(100% - ${targetWidth})`}
        id="main"
        css={css`
          outline: 1px solid blue;
        `}
        paddingTop={showTimelineAlerts ? '0' : SPACING.spacing24}
        position={POSITION_RELATIVE}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          maxWidth={CONTENT_MAX_WIDTH}
        >
          {showTimelineAlerts ? (
            <TimelineAlerts justifyContent={JUSTIFY_CENTER} width="100%" />
          ) : null}
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            {currentStep != null && hoveredTerminalItem == null ? (
              <StyledText desktopStyle="headingSmallBold">
                {i18n.format(currentStep.stepName, 'capitalize')}
              </StyledText>
            ) : null}
            {(hoveredTerminalItem != null || selectedTerminalItem != null) &&
            currentHoveredStepId == null ? (
              <StyledText desktopStyle="headingSmallBold">
                {t(hoveredTerminalItem ?? selectedTerminalItem)}
              </StyledText>
            ) : null}

            <ToggleGroup
              selectedValue={deckView}
              leftText={leftString}
              rightText={rightString}
              leftClick={() => {
                setDeckView(leftString)
              }}
              rightClick={() => {
                setDeckView(rightString)
              }}
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
            {deckView === leftString ? (
              <DeckSetupContainer tab="protocolSteps" />
            ) : (
              <OffDeck tab="protocolSteps" />
            )}
            {formData == null ? (
              <StepSummary
                currentStep={currentStep}
                stepDetails={stepDetails}
              />
            ) : null}
          </Flex>
        </Flex>
        {enableHoyKeyDisplay ? (
          <Flex
            id="hotkey-display"
            position={POSITION_FIXED}
            left={`calc(1.5rem + ${targetWidth}px)`}
            bottom="0.75rem"
            gridGap={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
            css={css`
              outline: 1px solid orange;
            `}
          >
            <Tag
              text={t('double_click_to_edit')}
              type="default"
              shrinkToContent
            />
            <Tag
              text={t('shift_click_to_select_range')}
              type="default"
              shrinkToContent
            />
            <Tag
              text={t('command_click_to_multi_select')}
              type="default"
              shrinkToContent
            />
          </Flex>
        ) : null}
      </Flex>
      {formData == null && selectedSubstep ? (
        <SubstepsToolbox stepId={selectedSubstep} />
      ) : null}
      <StepForm />
      {isMultiSelectMode ? <BatchEditToolbox /> : null}
    </Flex>
  )
}
