import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  MenuItem,
  NO_WRAP,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { analyticsEvent } from '../../../../analytics/actions'
import { actions as stepsActions } from '../../../../ui/steps'
import {
  hoverOnStep,
  toggleViewSubstep,
} from '../../../../ui/steps/actions/actions'
import {
  getBatchEditFormHasUnsavedChanges,
  getCurrentFormHasUnsavedChanges,
  getSavedStepForms,
  getUnsavedForm,
} from '../../../../step-forms/selectors'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../../types'
import type { StepIdType } from '../../../../form-types'
import type { AnalyticsEvent } from '../../../../analytics/mixpanel'

interface StepOverflowMenuProps {
  stepId: string
  menuRootRef: React.MutableRefObject<HTMLDivElement | null>
  top: number
  setOpenedOverflowMenuId: React.Dispatch<React.SetStateAction<string | null>>
  handleEdit: () => void
  confirmDelete: () => void
  confirmMultiDelete: () => void
  multiSelectItemIds: string[] | null
}

export function StepOverflowMenu(props: StepOverflowMenuProps): JSX.Element {
  const {
    stepId,
    menuRootRef,
    top,
    setOpenedOverflowMenuId,
    handleEdit,
    confirmDelete,
    confirmMultiDelete,
    multiSelectItemIds,
  } = props
  const { t } = useTranslation('protocol_steps')
  const singleEditFormHasUnsavedChanges = useSelector(
    getCurrentFormHasUnsavedChanges
  )
  const batchEditFormHasUnstagedChanges = useSelector(
    getBatchEditFormHasUnsavedChanges
  )
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const formData = useSelector(getUnsavedForm)
  const savedStepFormData = useSelector(getSavedStepForms)[stepId]
  const isPipetteStep =
    savedStepFormData.stepType === 'moveLiquid' ||
    savedStepFormData.stepType === 'mix'
  const isThermocyclerProfile = savedStepFormData.stepType === 'thermocycler'

  const duplicateStep = (
    stepId: StepIdType
  ): ReturnType<typeof stepsActions.duplicateStep> =>
    dispatch(stepsActions.duplicateStep(stepId))

  const duplicateMultipleSteps = (): void => {
    if (multiSelectItemIds) {
      dispatch(stepsActions.duplicateMultipleSteps(multiSelectItemIds))
    } else {
      console.warn(
        'something went wrong, you cannot duplicate multiple steps if none are selected'
      )
    }
  }

  const selectViewDetailsEvent: AnalyticsEvent = {
    name: 'openStepDetails',
    properties: {},
  }

  return (
    <>
      <Flex
        ref={menuRootRef}
        zIndex={12}
        top={top}
        left="18.75rem"
        position={POSITION_ABSOLUTE}
        whiteSpace={NO_WRAP}
        borderRadius={BORDERS.borderRadius8}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        backgroundColor={COLORS.white}
        flexDirection={DIRECTION_COLUMN}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {multiSelectItemIds != null && multiSelectItemIds.length > 0 ? (
          <>
            <MenuItem
              disabled={batchEditFormHasUnstagedChanges}
              onClick={() => {
                duplicateMultipleSteps()
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('duplicate_steps')}
            </MenuItem>
            <Divider marginY="0" />
            <MenuItem
              onClick={() => {
                confirmMultiDelete()
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('delete_steps')}
            </MenuItem>
          </>
        ) : (
          <>
            {formData != null ? null : (
              <MenuItem onClick={handleEdit}>{t('edit_step')}</MenuItem>
            )}
            {isPipetteStep || isThermocyclerProfile ? (
              <MenuItem
                disabled={formData != null}
                onClick={() => {
                  setOpenedOverflowMenuId(null)
                  dispatch(hoverOnStep(stepId))
                  dispatch(toggleViewSubstep(stepId))
                  dispatch(analyticsEvent(selectViewDetailsEvent))
                }}
              >
                {t('view_details')}
              </MenuItem>
            ) : null}
            <MenuItem
              disabled={singleEditFormHasUnsavedChanges}
              onClick={() => {
                duplicateStep(stepId)
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('duplicate')}
            </MenuItem>
            <Divider marginY="0" />
            <MenuItem
              onClick={() => {
                confirmDelete()
                setOpenedOverflowMenuId(null)
              }}
            >
              {t('delete')}
            </MenuItem>
          </>
        )}
      </Flex>
    </>
  )
}
