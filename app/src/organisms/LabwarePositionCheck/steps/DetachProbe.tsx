import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'

import { RobotMotionLoader } from '/app/organisms/LabwarePositionCheck/shared'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import detachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'
import detachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_96.webm'

import type { DetachProbeStep, LPCStepProps } from '../types'

export const DetachProbe = (
  props: LPCStepProps<DetachProbeStep>
): JSX.Element => {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const {
    step,
    protocolData,
    proceed,
    chainRunCommands,
    isRobotMoving,
    setErrorMessage,
  } = props

  const pipette = protocolData.pipettes.find(p => p.id === step.pipetteId)
  const pipetteName = pipette?.pipetteName
  const pipetteChannels =
    pipetteName != null ? getPipetteNameSpecs(pipetteName)?.channels ?? 1 : 1
  let probeVideoSrc = detachProbe1
  if (pipetteChannels === 8) {
    probeVideoSrc = detachProbe8
  } else if (pipetteChannels === 96) {
    probeVideoSrc = detachProbe96
  }
  const pipetteMount = pipette?.mount

  useEffect(() => {
    // move into correct position for probe detach on mount
    chainRunCommands(
      [
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: pipetteMount ?? 'left',
          },
        },
      ],
      false
    ).catch(error => {
      setErrorMessage(error.message as string)
    })
  }, [])

  // TOME TODO: Error instead of returning null.
  // if (pipetteName == null || pipetteMount == null) return null

  const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
    pipetteMount === 'left' ? 'leftZ' : 'rightZ'

  const handleProbeDetached = (): void => {
    chainRunCommands(
      [
        {
          commandType: 'retractAxis' as const,
          params: {
            axis: pipetteZMotorAxis,
          },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'x' },
        },
        {
          commandType: 'retractAxis' as const,
          params: { axis: 'y' },
        },
      ],
      false
    )
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setErrorMessage(
          `DetachProbe failed to move to safe location after probe detach with message: ${e.message}`
        )
      })
  }

  if (isRobotMoving)
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )

  return (
    <GenericWizardTile
      header={i18n.format(t('detach_probe'), 'capitalize')}
      //  todo(jr, 5/30/23): update animations! these are not final for 1, 8 and 96
      rightHandBody={
        <video
          css={css`
            padding-top: ${SPACING.spacing4};
            width: 100%;
            min-height: 18rem;
          `}
          autoPlay={true}
          loop={true}
          controls={false}
        >
          <source src={probeVideoSrc} />
        </video>
      }
      bodyText={
        <LegacyStyledText css={BODY_STYLE}>
          {i18n.format(t('remove_probe'), 'capitalize')}
        </LegacyStyledText>
      }
      proceedButtonText={t('confirm_detached')}
      proceed={handleProbeDetached}
    />
  )
}

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
