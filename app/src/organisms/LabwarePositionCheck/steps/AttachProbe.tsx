import { Trans, useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ProbeNotAttached } from '/app/organisms/PipetteWizardFlows/ProbeNotAttached'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  selectActivePipette,
  selectActivePipetteChannelCount,
} from '/app/organisms/LabwarePositionCheck/redux'

import attachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_1.webm'
import attachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_8.webm'
import attachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Attach_Probe_96.webm'

import type { AttachProbeStep, LPCStepProps } from '../types'

export function AttachProbe({
  proceed,
  commandUtils,
  state,
  step,
}: LPCStepProps<AttachProbeStep>): JSX.Element {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const { isOnDevice, steps } = state
  const { pipetteId } = step
  const {
    setShowUnableToDetect,
    unableToDetect,
    createProbeAttachmentHandler,
    handleCheckItemsPrepModules,
  } = commandUtils
  const pipette = selectActivePipette(step, state)
  const handleProbeAttached = createProbeAttachmentHandler(
    pipetteId,
    pipette,
    proceed
  )

  const { probeLocation, probeVideoSrc } = ((): {
    probeLocation: string
    probeVideoSrc: string
  } => {
    const channels = selectActivePipetteChannelCount(step, state)

    switch (channels) {
      case 1:
        return { probeLocation: '', probeVideoSrc: attachProbe1 }
      case 8:
        return { probeLocation: t('backmost'), probeVideoSrc: attachProbe8 }
      case 96:
        return {
          probeLocation: t('ninety_six_probe_location'),
          probeVideoSrc: attachProbe96,
        }
    }
  })()

  const handleConfirmProbeAttached = (): void => {
    void handleProbeAttached().then(() => {
      handleCheckItemsPrepModules(steps.next)
    })
  }

  if (unableToDetect) {
    return (
      <ProbeNotAttached
        handleOnClick={handleProbeAttached}
        setShowUnableToDetect={setShowUnableToDetect}
        isOnDevice={isOnDevice}
      />
    )
  } else {
    return (
      <GenericWizardTile
        header={i18n.format(t('attach_probe'), 'capitalize')}
        rightHandBody={
          <video css={VIDEO_STYLE} autoPlay={true} loop={true} controls={false}>
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
        proceed={handleConfirmProbeAttached}
      />
    )
  }
}

const VIDEO_STYLE = css`
  padding-top: ${SPACING.spacing4};
  width: 100%;
  min-height: 18rem;
`

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
