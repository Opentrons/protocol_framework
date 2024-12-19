import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  NO_WRAP,
  POSITION_ABSOLUTE,
  SecondaryButton,
  SPACING,
  StyledText,
  TOOLTIP_FIXED,
  TOOLTIP_TOP,
  Tooltip,
  useHoverTooltip,
  useOnClickOutside,
} from '@opentrons/components'
import {
  actions as stepsActions,
  getIsMultiSelectMode,
} from '../../../../ui/steps'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import {
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
  getMainPagePortalEl,
} from '../../../../organisms'
import { getEnableComment } from '../../../../feature-flags/selectors'
import { getIsStepTypeEnabled, getSupportedSteps } from './utils'

import { AddStepOverflowButton } from './AddStepOverflowButton'

import type { MouseEvent } from 'react'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../../types'
import type { StepType } from '../../../../form-types'

interface AddStepButtonProps {
  hasText: boolean
}

export function AddStepButton({ hasText }: AddStepButtonProps): JSX.Element {
  const { t } = useTranslation(['tooltip', 'button'])
  const enableComment = useSelector(getEnableComment)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })
  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const formHasChanges = useSelector(
    stepFormSelectors.getCurrentFormHasUnsavedChanges
  )
  const isStepCreationDisabled = useSelector(getIsMultiSelectMode)
  const modules = useSelector(stepFormSelectors.getInitialDeckSetup).modules
  const [showStepOverflowMenu, setShowStepOverflowMenu] = useState<boolean>(
    false
  )
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowStepOverflowMenu(false)
    },
  })
  const [enqueuedStepType, setEnqueuedStepType] = useState<StepType | null>(
    null
  )

  const addStep = (stepType: StepType): ReturnType<any> =>
    dispatch(stepsActions.addAndSelectStep({ stepType }))

  const items = getSupportedSteps(enableComment)
    .filter(stepType => getIsStepTypeEnabled(enableComment, modules)[stepType])
    .map(stepType => (
      <AddStepOverflowButton
        key={stepType}
        stepType={stepType}
        onClick={() => {
          if (currentFormIsPresaved || formHasChanges) {
            setEnqueuedStepType(stepType)
          } else {
            addStep(stepType)
          }
          setShowStepOverflowMenu(false)
        }}
      />
    ))

  return (
    <>
      {/* TODO(ja): update this modal to match latest modal designs */}
      {enqueuedStepType !== null &&
        createPortal(
          <ConfirmDeleteModal
            modalType={CLOSE_UNSAVED_STEP_FORM}
            onCancelClick={() => {
              setEnqueuedStepType(null)
            }}
            onContinueClick={() => {
              if (enqueuedStepType !== null) {
                addStep(enqueuedStepType)
                setEnqueuedStepType(null)
              }
            }}
          />,
          getMainPagePortalEl()
        )}

      {showStepOverflowMenu ? (
        <Flex
          css={STEP_OVERFLOW_MENU_STYLE}
          ref={overflowWrapperRef}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {items}
        </Flex>
      ) : null}

      {isStepCreationDisabled && (
        <Tooltip tooltipProps={tooltipProps}>
          {t(`disabled_step_creation`)}
        </Tooltip>
      )}
      <SecondaryButton
        display={DISPLAY_FLEX}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing10}
        width="100%"
        {...targetProps}
        id="AddStepButton"
        onClick={() => {
          setShowStepOverflowMenu(true)
        }}
        disabled={isStepCreationDisabled}
      >
        <Icon name="plus" size="1rem" />
        {hasText ? <StyledText>{t('button:add_step')}</StyledText> : null}
      </SecondaryButton>
    </>
  )
}

const STEP_OVERFLOW_MENU_STYLE = css`
  position: ${POSITION_ABSOLUTE};
  z-index: 5;
  right: -7.75rem;
  white-space: ${NO_WRAP};
  bottom: 4.2rem;
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  background-color: ${COLORS.white};
  flex-direction: ${DIRECTION_COLUMN};
`
