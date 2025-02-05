import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import { SPACING } from '@opentrons/components'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

// TODO(jh, 02-05-25): Move ChildNavigation to molecules.
// eslint-disable-next-line opentrons/no-imports-across-applications
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import {
  clearSelectedLabware,
  LPC_STEP,
  selectActivePipette,
  selectCurrentStep,
  selectSelectedLabwareDisplayName,
  selectSelectedLabwareInfo,
  selectStepInfo,
} from '/app/redux/protocol-runs'
import { StepMeter } from '/app/atoms/StepMeter'

// eslint-disable-next-line opentrons/no-imports-across-applications
import type { ChildNavigationProps } from '/app/organisms/ODD/ChildNavigation'

// TOME TODO: TAKE A DIFFERENT ANGLE. MAKE A COMPONENT THAT IS A WRAPPER AND TAKES A CHILD
// THAT IS A JSX ELEMENT THAT IS THE ACTUAL CONTENT. THE WRAPPER CONTAINS THE HEADER, BUT YOU RENDER THIS ON EVERY PAGE.
// This gets around (hopefully) weird render issues, but also makes it much easier for handling go
// back functionality between substeps of the flow.
export function LPCWizardHeader({
  runId,
  commandUtils,
  proceedStep,
  goBackLastStep,
  onCloseClick,
}: LPCWizardContentProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const dispatch = useDispatch()
  const { currentStepIndex, totalStepCount } = useSelector(
    selectStepInfo(runId)
  )
  const currentStep = useSelector(selectCurrentStep(runId))
  const pipette = useSelector(selectActivePipette(runId))
  const selectedLw = useSelector(selectSelectedLabwareInfo(runId))
  const selectedLwDisplayName = useSelector(
    selectSelectedLabwareDisplayName(runId)
  )

  const {
    unableToDetect,
    errorMessage,
    toggleRobotMoving,
    handleValidMoveToMaintenancePosition,
    handleProbeAttachment,
    showExitConfirmation,
    isExiting,
    confirmExitLPC,
  } = commandUtils // TOME TODO: Delete some of these exiting props. I'm not sure you need any of them anymore.

  const handleAttachProbeCheck = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleProbeAttachment(pipette, proceedStep))
      .then(() => {
        proceedStep()
      })
      .finally(() => toggleRobotMoving(false))
  }

  const handleNavToDetachProbe = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleValidMoveToMaintenancePosition(pipette))
      .then(() => {
        proceedStep(LPC_STEP.DETACH_PROBE)
      })
      .finally(() => toggleRobotMoving(false))
  }

  const handleProceed = (): void => {
    proceedStep()
  }

  const handleNavToLabwareList = (): void => {
    dispatch(clearSelectedLabware(runId))
  }

  const getNavProps = (): Partial<ChildNavigationProps> & {
    header: string
  } => {
    console.log('getNavProps called with:', {
      currentStep,
      unableToDetect,
      errorMessage,
    })

    if (unableToDetect) {
      return {
        header: t('labware_position_check_title'),
        buttonText: t('try_again'),
        onClickButton: handleAttachProbeCheck,
        secondaryButtonProps: {
          buttonText: t('exit'),
          buttonCategory: 'rounded',
          buttonType: 'tertiaryLowLight',
          onClick: handleNavToDetachProbe,
        },
      }
    } else if (errorMessage != null) {
      return {
        header: t('labware_position_check_title'),
        // If the maintenance run fails, we cannot move the gantry, so just clean up LPC.
        onClickButton: onCloseClick,
        buttonText: t('exit'),
      }
    } else {
      switch (currentStep) {
        case LPC_STEP.BEFORE_BEGINNING:
          return {
            header: t('labware_position_check_title'),
            onClickButton: handleProceed,
            buttonText: t('continue'),
            secondaryButtonProps: {
              buttonText: t('exit'),
              buttonCategory: 'rounded',
              buttonType: 'tertiaryLowLight',
              onClick: handleNavToDetachProbe,
            },
          }
        case LPC_STEP.ATTACH_PROBE:
          return {
            header: t('labware_position_check_title'),
            onClickButton: handleAttachProbeCheck,
            buttonText: t('continue'),
            secondaryButtonProps: {
              buttonText: t('exit'),
              buttonCategory: 'rounded',
              buttonType: 'tertiaryLowLight',
              onClick: handleNavToDetachProbe,
            },
          }
        case LPC_STEP.HANDLE_LABWARE: {
          if (selectedLw == null) {
            return {
              header: t('labware_position_check_title'),
              onClickButton: handleNavToDetachProbe,
              buttonText: t('exit'),
            }
          } else if (selectedLw.offsetLocationDetails == null) {
            return {
              header: selectedLwDisplayName,
              buttonText: t('save'),
              buttonIsDisabled: true,
              // TODO(jh, 02-05-25): EXEC-1119.
              onClickButton: () => null,
              onClickBack: handleNavToLabwareList,
            }
          } else {
            // TODO(jh, 02-05-25): EXEC-1128.
            return {
              header:
                'this is subject to change based on the offset type and existence of said offset',
              buttonText: t('confirm_placement'),
              onClickBack: () => null,
              onClickButton: () => null,
            }
          }
        }
        case LPC_STEP.DETACH_PROBE: {
          return {
            header: t('labware_position_check_title'),
            buttonText: t('confirm_removal'),
            onClickBack: goBackLastStep,
            onClickButton: handleProceed,
          }
        }
        case LPC_STEP.LPC_COMPLETE: {
          return {
            header: t('labware_position_check_title'),
            buttonText: t('exit'),
            onClickButton: onCloseClick,
          }
        }
        default: {
          console.error('Unhandled step view.')
          return {
            header: t('labware_position_check_title'),
            onClickButton: handleNavToDetachProbe,
            buttonText: t('exit'),
          }
        }
      }
    }
  }

  return (
    <>
      <StepMeter totalSteps={totalStepCount} currentStep={currentStepIndex} />
      <ChildNavigation {...getNavProps()} css={CHILD_NAV_STYLE} />
    </>
  )
}

// TODO(jh, 02-05-25): Investigate whether we can remove the position: fixed styling from ChildNav.
const CHILD_NAV_STYLE = css`
  top: ${SPACING.spacing8};
`
