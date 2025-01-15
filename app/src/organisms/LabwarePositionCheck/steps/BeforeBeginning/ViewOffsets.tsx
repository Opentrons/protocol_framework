import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ModalShell,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getLatestCurrentOffsets } from '/app/transformations/runs'
import { getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons'
import { TerseOffsetTable } from '/app/organisms/TerseOffsetTable'

import type { LabwareOffset } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

interface ViewOffsetsProps {
  existingOffsets: LabwareOffset[]
  labwareDefinitions: LabwareDefinition2[]
}
export function ViewOffsets(props: ViewOffsetsProps): JSX.Element {
  const { existingOffsets, labwareDefinitions } = props
  const { t, i18n } = useTranslation('labware_position_check')

  const [showOffsetsTable, setShowOffsetsModal] = useState(false)

  const latestCurrentOffsets = getLatestCurrentOffsets(existingOffsets)

  return existingOffsets.length > 0 ? (
    <>
      <Btn
        display="flex"
        gridGap={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
        onClick={() => {
          setShowOffsetsModal(true)
        }}
        css={VIEW_OFFSETS_BUTTON_STYLE}
        aria-label="show labware offsets"
      >
        <Icon name="reticle" size="1.75rem" color={COLORS.black90} />
        <LegacyStyledText as="p">
          {i18n.format(t('view_current_offsets'), 'capitalize')}
        </LegacyStyledText>
      </Btn>
      {showOffsetsTable
        ? createPortal(
            <ModalShell
              width="60rem"
              height="33.5rem"
              padding={SPACING.spacing32}
              display="flex"
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              header={
                <LegacyStyledText
                  as="h4"
                  fontWeight={TYPOGRAPHY.fontWeightBold}
                >
                  {i18n.format(t('labware_offset_data'), 'capitalize')}
                </LegacyStyledText>
              }
              footer={
                <SmallButton
                  width="100%"
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  buttonText={t('shared:close')}
                  onClick={() => {
                    setShowOffsetsModal(false)
                  }}
                />
              }
            >
              <Box overflowY="scroll" marginBottom={SPACING.spacing16}>
                <TerseOffsetTable
                  offsets={latestCurrentOffsets}
                  labwareDefinitions={labwareDefinitions}
                />
              </Box>
            </ModalShell>,
            getTopPortalEl()
          )
        : null}
    </>
  ) : (
    <Flex />
  )
}

const VIEW_OFFSETS_BUTTON_STYLE = css`
  ${TYPOGRAPHY.pSemiBold};
  color: ${COLORS.black90};
  font-size: ${TYPOGRAPHY.fontSize22};
  &:hover {
    opacity: 100%;
  }
  &:active {
    opacity: 70%;
  }
`
