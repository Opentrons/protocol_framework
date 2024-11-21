import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import ReactPlayer from 'react-player/lazy'
import { useState } from 'react'
import {
  ALIGN_CENTER,
  ALIGN_END,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LargeButton,
  OVERFLOW_SCROLL,
  SPACING,
  StyledText,
  Tooltip,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import one from '../../assets/images/onboarding_animation_1.webm'
import two from '../../assets/images/onboarding_animation_2.webm'
import three from '../../assets/images/onboarding_animation_3.webm'
import four from '../../assets/images/onboarding_animation_4.webm'
import five from '../../assets/images/onboarding_animation_5.webm'
import six from '../../assets/images/onboarding_animation_6.webm'
import { BUTTON_LINK_STYLE } from '../../atoms'

interface WizardBodyProps {
  stepNumber: number
  header: string
  children: React.ReactNode
  proceed: () => void
  disabled?: boolean
  goBack?: () => void
  subHeader?: string
  tooltipOnDisabled?: string
}

const ONBOARDING_ANIMATIONS: Record<number, string> = {
  1: one,
  2: two,
  3: three,
  4: four,
  5: five,
  6: six,
}

export function WizardBody(props: WizardBodyProps): JSX.Element {
  const {
    stepNumber,
    header,
    children,
    goBack,
    subHeader,
    proceed,
    disabled = false,
    tooltipOnDisabled,
  } = props
  const { t } = useTranslation('shared')
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })
  const [isBuffering, setIsBuffering] = useState(false)

  const handleBuffer = (): void => {
    setIsBuffering(true)
  }

  const handlePlay = (): void => {
    if (isBuffering) {
      setIsBuffering(false)
    }
  }

  return (
    <Flex
      padding={SPACING.spacing16}
      gridGap={SPACING.spacing16}
      height="calc(100vh - 48px)"
    >
      <Flex
        width="60%"
        padding={SPACING.spacing80}
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing24}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          height="100%"
          overflowY={OVERFLOW_SCROLL}
        >
          <StyledText
            color={COLORS.grey60}
            desktopStyle="bodyDefaultSemiBold"
            textTransform={TYPOGRAPHY.textTransformUppercase}
          >
            {t('shared:step_count', { current: stepNumber })}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing60}>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
              <StyledText desktopStyle="displayBold">{header}</StyledText>
              {subHeader != null ? (
                <StyledText
                  desktopStyle="headingLargeRegular"
                  color={COLORS.grey60}
                >
                  {subHeader}
                </StyledText>
              ) : null}
            </Flex>
            {children}
          </Flex>
        </Flex>
        <Flex
          alignSelf={goBack != null ? 'auto' : ALIGN_END}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          {goBack != null ? (
            <Btn onClick={goBack} css={BUTTON_LINK_STYLE} height="1.5rem">
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('go_back')}
              </StyledText>
            </Btn>
          ) : null}
          <Flex {...targetProps} maxHeight="3.5rem">
            <LargeButton
              disabled={disabled}
              onClick={proceed}
              iconName="arrow-right"
              buttonText={t('shared:confirm')}
              height="3.5rem"
              width="8.5625rem"
            />
          </Flex>
          {tooltipOnDisabled != null ? (
            <Tooltip tooltipProps={tooltipProps}>{tooltipOnDisabled}</Tooltip>
          ) : null}
        </Flex>
      </Flex>
      <Flex width="40%">
        <Flex
          css={css`
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: relative;
            object-fit: cover;
            border-radius: ${BORDERS.borderRadius16};
          `}
        >
          <ReactPlayer
            width="100%"
            height="100%"
            url={ONBOARDING_ANIMATIONS[stepNumber]}
            playing={true}
            controls={false}
            onBuffer={handleBuffer}
            onPlay={handlePlay}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
