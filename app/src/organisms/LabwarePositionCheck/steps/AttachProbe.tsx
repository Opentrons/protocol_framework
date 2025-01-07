import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { css } from 'styled-components'
import { ProbeNotAttached } from '/app/organisms/PipetteWizardFlows/ProbeNotAttached'
import { RobotMotionLoader } from '/app/organisms/LabwarePositionCheck/shared'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import attachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import attachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_96.webm'

import type { AttachProbeStep, LPCStepProps } from '../types'

export function AttachProbe({
  step,
  protocolData,
  proceed,
  isOnDevice,
  commandUtils,
}: LPCStepProps<AttachProbeStep>): JSX.Element {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const {
    moveToMaintenancePosition,
    setShowUnableToDetect,
    unableToDetect,
    isRobotMoving,
    createProbeAttachmentHandler,
  } = commandUtils

  const { pipetteId } = step
  const pipette = protocolData.pipettes.find(p => p.id === pipetteId)
  const pipetteName = pipette?.pipetteName
  const pipetteChannels =
    pipetteName != null ? getPipetteNameSpecs(pipetteName)?.channels ?? 1 : 1
  let probeVideoSrc = attachProbe1
  let probeLocation = ''
  if (pipetteChannels === 8) {
    probeLocation = t('backmost')
    probeVideoSrc = attachProbe8
  } else if (pipetteChannels === 96) {
    probeLocation = t('ninety_six_probe_location')
    probeVideoSrc = attachProbe96
  }

  const handleProbeAttached = createProbeAttachmentHandler(
    pipetteId,
    pipette,
    proceed
  )

  useEffect(() => {
    // move into correct position for probe attach on mount
    moveToMaintenancePosition(pipette)
  }, [])

  // TOME TODO: Instead of returning null, show an error.
  // if (pipetteName == null || pipetteMount == null) return null

  if (isRobotMoving)
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )
  else if (unableToDetect)
    return (
      <ProbeNotAttached
        handleOnClick={handleProbeAttached}
        setShowUnableToDetect={setShowUnableToDetect}
        isOnDevice={isOnDevice}
      />
    )

  return (
    <GenericWizardTile
      header={i18n.format(t('attach_probe'), 'capitalize')}
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
          <Trans
            t={t}
            i18nKey={'install_probe'}
            values={{ location: probeLocation }}
            components={{
              bold: <strong />,
            }}
          />
        </LegacyStyledText>
      }
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
      proceed={handleProbeAttached}
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
