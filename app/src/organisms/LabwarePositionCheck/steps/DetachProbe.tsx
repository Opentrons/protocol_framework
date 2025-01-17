import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { useSelector } from 'react-redux'

import {
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  selectActivePipette,
  selectActivePipetteChannelCount,
} from '/app/redux/protocol-runs'

import detachProbe1 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_1.webm'
import detachProbe8 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_8.webm'
import detachProbe96 from '/app/assets/videos/pipette-wizard-flows/Pipette_Detach_Probe_96.webm'

import type { DetachProbeStep, LPCStepProps } from '../types'
import type { State } from '/app/redux/types'
import type { StepsInfo } from '/app/organisms/LabwarePositionCheck/redux/types'

export const DetachProbe = ({
  runId,
  proceed,
  commandUtils,
}: LPCStepProps<DetachProbeStep>): JSX.Element => {
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const { current: currentStep } = useSelector(
    (state: State) => state.protocolRuns[runId]?.lpc?.steps as StepsInfo
  )
  const { createProbeDetachmentHandler, toggleRobotMoving } = commandUtils
  const pipette = useSelector((state: State) =>
    selectActivePipette(currentStep, runId, state)
  )
  const channels = useSelector((state: State) =>
    selectActivePipetteChannelCount(currentStep, runId, state)
  )

  const probeVideoSrc = ((): string => {
    switch (channels) {
      case 1:
        return detachProbe1
      case 8:
        return detachProbe8
      case 96:
        return detachProbe96
    }
  })()

  const handleProbeDetached = createProbeDetachmentHandler(pipette, proceed)

  const handleProceed = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleProbeDetached())
      .finally(() => toggleRobotMoving(false))
  }

  return (
    <GenericWizardTile
      header={i18n.format(t('detach_probe'), 'capitalize')}
      //  todo(jr, 5/30/23): update animations! these are not final for 1, 8 and 96
      rightHandBody={
        <video css={VIDEO_STYLE} autoPlay={true} loop={true} controls={false}>
          <source src={probeVideoSrc} />
        </video>
      }
      bodyText={
        <LegacyStyledText css={BODY_STYLE}>
          {i18n.format(t('remove_probe'), 'capitalize')}
        </LegacyStyledText>
      }
      proceedButtonText={t('confirm_detached')}
      proceed={handleProceed}
    />
  )
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
