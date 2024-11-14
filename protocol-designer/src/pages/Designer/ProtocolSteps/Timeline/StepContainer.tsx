import { createPortal } from 'react-dom'
import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  CURSOR_DEFAULT,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  OverflowBtn,
  SPACING,
  StyledText,
  useConditionalConfirm,
} from '@opentrons/components'
import {
  ConfirmDeleteModal,
  DELETE_MULTIPLE_STEP_FORMS,
  DELETE_STEP_FORM,
} from '../../../../components/modals/ConfirmDeleteModal'
import { getTopPortalEl } from '../../../../components/portals/TopPortal'
import { actions as steplistActions } from '../../../../steplist'
import {
  deselectAllSteps,
  populateForm,
} from '../../../../ui/steps/actions/actions'
import { getMultiSelectItemIds } from '../../../../ui/steps/selectors'
import { LINE_CLAMP_TEXT_STYLE } from '../../../../atoms'
import { StepOverflowMenu } from './StepOverflowMenu'
import { capitalizeFirstLetterAfterNumber } from './utils'

import type {
  SetStateAction,
  Dispatch,
  MouseEvent as ReactMouseEvent,
} from 'react'
import type { ThunkDispatch } from 'redux-thunk'
import type { IconName } from '@opentrons/components'
import type { StepIdType } from '../../../../form-types'
import type { BaseState } from '../../../../types'

const STARTING_DECK_STATE = 'Starting deck state'
const FINAL_DECK_STATE = 'Final deck state'

export interface StepContainerProps {
  title: string
  iconName: IconName
  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>
  stepId?: string
  iconColor?: string
  onClick?: (event: ReactMouseEvent) => void
  onDoubleClick?: (event: ReactMouseEvent) => void
  onMouseEnter?: (event: ReactMouseEvent) => void
  onMouseLeave?: (event: ReactMouseEvent) => void
  selected?: boolean
  hovered?: boolean
  hasError?: boolean
  isStepAfterError?: boolean
  dragHovered?: boolean
}

export function StepContainer(props: StepContainerProps): JSX.Element {
  const {
    stepId,
    iconName,
    onDoubleClick,
    onMouseEnter,
    onMouseLeave,
    selected,
    onClick,
    hovered,
    iconColor,
    title,
    hasError = false,
    isStepAfterError = false,
    dragHovered = false,
    setOpenedOverflowMenuId,
    openedOverflowMenuId,
  } = props
  const [top, setTop] = useState<number>(0)
  const menuRootRef = useRef<HTMLDivElement | null>(null)
  const isStartingOrEndingState =
    title === STARTING_DECK_STATE || title === FINAL_DECK_STATE
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)

  let backgroundColor = isStartingOrEndingState ? COLORS.blue20 : COLORS.grey20
  let color = COLORS.black90
  if (selected) {
    backgroundColor = COLORS.blue50
    color = COLORS.white
  }
  if (hovered && !selected) {
    backgroundColor = isStartingOrEndingState ? COLORS.blue30 : COLORS.grey30
    color = COLORS.black90
  }
  if (hasError) {
    backgroundColor = COLORS.red50
    color = COLORS.white
  }

  const handleClick = (event: MouseEvent): void => {
    const wasOutside = !(
      event.target instanceof Node &&
      menuRootRef.current?.contains(event.target)
    )

    if (wasOutside && setOpenedOverflowMenuId) {
      setOpenedOverflowMenuId(null)
    }
  }

  const handleOverflowClick = (event: ReactMouseEvent): void => {
    const buttonRect = event.currentTarget.getBoundingClientRect()
    const screenHeight = window.innerHeight
    const rootHeight = menuRootRef.current?.offsetHeight || 0

    const spaceBelow = screenHeight - buttonRect.bottom
    const top =
      spaceBelow > rootHeight
        ? buttonRect.bottom - 32
        : buttonRect.top - rootHeight + 32

    setTop(top)
  }

  useEffect(() => {
    global.addEventListener('click', handleClick)
    return () => {
      global.removeEventListener('click', handleClick)
    }
  })

  const handleStepItemSelection = (): void => {
    if (stepId != null) {
      dispatch(populateForm(stepId))
    }
    setOpenedOverflowMenuId?.(null)
  }

  const onDeleteClickAction = (): void => {
    if (multiSelectItemIds) {
      dispatch(steplistActions.deleteMultipleSteps(multiSelectItemIds))
      dispatch(deselectAllSteps('EXIT_BATCH_EDIT_MODE_BUTTON_PRESS'))
    } else {
      console.warn(
        'something went wrong, you cannot delete multiple steps if none are selected'
      )
    }
  }

  const {
    confirm: confirmMultiDelete,
    showConfirmation: showMultiDeleteConfirmation,
    cancel: cancelMultiDelete,
  } = useConditionalConfirm(onDeleteClickAction, true)

  const deleteStep = (stepId: StepIdType): void => {
    dispatch(steplistActions.deleteStep(stepId))
  }

  const handleDelete = (): void => {
    if (stepId != null) {
      deleteStep(stepId)
    } else {
      console.warn(
        'something went wrong, cannot delete a step without a step id'
      )
    }
  }
  const {
    confirm: confirmDelete,
    showConfirmation: showDeleteConfirmation,
    cancel: cancelDelete,
  } = useConditionalConfirm(handleDelete, true)
  console.log(openedOverflowMenuId, stepId)
  return (
    <>
      {showDeleteConfirmation && (
        <ConfirmDeleteModal
          modalType={DELETE_STEP_FORM}
          onCancelClick={cancelDelete}
          onContinueClick={confirmDelete}
        />
      )}
      {showMultiDeleteConfirmation && (
        <ConfirmDeleteModal
          modalType={DELETE_MULTIPLE_STEP_FORMS}
          onContinueClick={confirmMultiDelete}
          onCancelClick={cancelMultiDelete}
        />
      )}
      <Flex
        id={stepId}
        {...{
          onMouseEnter: isStepAfterError ? undefined : onMouseEnter,
          onMouseLeave: isStepAfterError ? undefined : onMouseLeave,
        }}
        gridGap={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
      >
        <Box
          role="button"
          onDoubleClick={onDoubleClick}
          onClick={onClick}
          padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
          borderRadius={BORDERS.borderRadius8}
          width="100%"
          backgroundColor={backgroundColor}
          color={color}
          opacity={isStepAfterError ? '50%' : '100%'}
          cursor={isStepAfterError ? CURSOR_DEFAULT : CURSOR_POINTER}
        >
          <Flex
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
            height="1.75rem"
          >
            <Flex
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing8}
              justifyContent={JUSTIFY_START}
              width="100%"
            >
              {iconName && (
                <Icon
                  size="1.25rem"
                  name={iconName}
                  color={iconColor ?? color}
                  minWidth="1.25rem"
                />
              )}
              <StyledText
                desktopStyle="bodyDefaultRegular"
                css={LINE_CLAMP_TEXT_STYLE(1)}
              >
                {capitalizeFirstLetterAfterNumber(title)}
              </StyledText>
            </Flex>
            {selected && !isStartingOrEndingState ? (
              <OverflowBtn
                data-testid={`StepContainer_${stepId}`}
                fillColor={COLORS.white}
                onClick={(e: ReactMouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (setOpenedOverflowMenuId != null) {
                    if (openedOverflowMenuId === stepId) {
                      setOpenedOverflowMenuId(null)
                    } else {
                      setOpenedOverflowMenuId(stepId ?? null)
                    }
                  }
                  handleOverflowClick(e)
                }}
              />
            ) : null}
          </Flex>
        </Box>
        {dragHovered ? (
          <Divider
            marginY="0"
            height="0.25rem"
            width="100%"
            backgroundColor={COLORS.blue50}
            borderRadius={BORDERS.borderRadius2}
          />
        ) : null}
      </Flex>
      {stepId != null &&
      openedOverflowMenuId === stepId &&
      setOpenedOverflowMenuId != null
        ? createPortal(
            <StepOverflowMenu
              setOpenedOverflowMenuId={setOpenedOverflowMenuId}
              stepId={stepId}
              menuRootRef={menuRootRef}
              top={top}
              handleEdit={handleStepItemSelection}
              confirmDelete={confirmDelete}
              confirmMultiDelete={confirmMultiDelete}
              multiSelectItemIds={multiSelectItemIds}
            />,
            getTopPortalEl()
          )
        : null}
    </>
  )
}
