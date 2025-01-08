import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_STRETCH,
  Box,
  Btn,
  Checkbox,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  DISPLAY_INLINE_BLOCK,
  FLEX_MAX_CONTENT,
  Flex,
  JUSTIFY_END,
  Modal,
  OVERFLOW_AUTO,
  PrimaryButton,
  PRODUCT,
  RadioButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getAllPipetteNames,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { getAllowAllTipracks } from '../../feature-flags/selectors'
import {
  getAdditionalEquipment,
  getInitialDeckSetup,
  getPipetteEntities,
} from '../../step-forms/selectors'
import { getHas96Channel, removeOpentronsPhrases } from '../../utils'

import { getRobotType } from '../../file-data/selectors'
import {
  PIPETTE_GENS,
  PIPETTE_TYPES,
  PIPETTE_VOLUMES,
} from '../../pages/CreateNewProtocolWizard/constants'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import { setFeatureFlags } from '../../feature-flags/actions'
import { createCustomTiprackDef } from '../../labware-defs/actions'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getMainPagePortalEl } from '../Portal'
import { getShouldShowPipetteType, getTiprackOptions } from './utils'
import { editPipettes } from './editPipettes'
import { HandleEnter } from '../../atoms/HandleEnter'
import { PipetteOverview } from './PipetteOverview'

import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteInfoByGen,
  PipetteInfoByType,
  PipetteType,
} from '../../pages/CreateNewProtocolWizard/types'
import type { ThunkDispatch } from '../../types'

interface EditInstrumentsModalProps {
  onClose: () => void
}

export function EditInstrumentsModal(
  props: EditInstrumentsModalProps
): JSX.Element {
  const { onClose } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation([
    'create_new_protocol',
    'protocol_overview',
    'shared',
  ])
  const [page, setPage] = useState<'add' | 'overview'>('overview')
  const [mount, setMount] = useState<PipetteMount>('left')
  const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)
  const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  const [selectedTips, setSelectedTips] = useState<string[]>([])
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const robotType = useSelector(getRobotType)
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const pipetteEntities = useSelector(getPipetteEntities)
  const allLabware = useSelector(getLabwareDefsByURI)
  const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
  const { pipettes, labware } = initialDeckSetup
  const pipettesOnDeck = Object.values(pipettes)
  const has96Channel = getHas96Channel(pipetteEntities)
  const leftPipette = pipettesOnDeck.find(pipette => pipette.mount === 'left')
  const rightPipette = pipettesOnDeck.find(pipette => pipette.mount === 'right')
  const gripper = Object.values(additionalEquipment).find(
    ae => ae.name === 'gripper'
  )
  const selectedPip =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  const resetFields = (): void => {
    setPipetteType(null)
    setPipetteGen('flex')
    setPipetteVolume(null)
  }

  const handleOnSave = (): void => {
    if (page === 'overview') {
      onClose()
    } else {
      setPage('overview')
      editPipettes(
        labware,
        pipettes,
        orderedStepIds,
        dispatch,
        mount,
        selectedPip as PipetteName,
        selectedTips,
        leftPipette,
        rightPipette
      )
    }
  }

  return createPortal(
    <HandleEnter onEnter={handleOnSave}>
      <Modal
        marginLeft="0"
        title={
          page === 'add'
            ? t('shared:edit_pipette')
            : t('shared:edit_instruments')
        }
        type="info"
        closeOnOutsideClick
        width="37.125rem"
        onClose={() => {
          resetFields()
          onClose()
        }}
        footer={
          <Flex
            justifyContent={JUSTIFY_END}
            gridGap={SPACING.spacing8}
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          >
            <SecondaryButton
              onClick={() => {
                if (page === 'overview') {
                  onClose()
                } else {
                  setPage('overview')
                  resetFields()
                }
              }}
            >
              {page === 'overview' ? t('shared:cancel') : t('shared:back')}
            </SecondaryButton>
            <PrimaryButton
              disabled={
                page === 'add' &&
                (pipetteVolume == null ||
                  pipetteType == null ||
                  pipetteGen == null ||
                  selectedTips.length === 0)
              }
              onClick={handleOnSave}
            >
              {t('shared:save')}
            </PrimaryButton>
          </Flex>
        }
      >
        {page === 'overview' ? (
          <PipetteOverview
            has96Channel={has96Channel}
            labware={labware}
            pipettes={pipettes}
            robotType={robotType}
            setPage={setPage}
            setMount={setMount}
            setPipetteType={setPipetteType}
            setPipetteGen={setPipetteGen}
            setPipetteVolume={setPipetteVolume}
            setSelectedTips={setSelectedTips}
            leftPipette={leftPipette}
            rightPipette={rightPipette}
            gripper={gripper}
          />
        ) : (
          <Flex
            flexDirection="column"
            overflowY={OVERFLOW_AUTO}
            gridGap={SPACING.spacing24}
          >
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
              <StyledText desktopStyle="bodyLargeSemiBold">
                {t('pipette_type')}
              </StyledText>
              <Flex gridGap={SPACING.spacing4}>
                {PIPETTE_TYPES[robotType].map(type => {
                  return getShouldShowPipetteType(
                    type.value as PipetteType,
                    has96Channel,
                    leftPipette,
                    rightPipette,
                    mount
                  ) ? (
                    <RadioButton
                      key={`${type.label}_${type.value}`}
                      onChange={() => {
                        setPipetteType(type.value)
                        setPipetteGen('flex')
                        setPipetteVolume(null)
                        setSelectedTips([])
                      }}
                      buttonLabel={t(`shared:${type.label}`)}
                      buttonValue="single"
                      isSelected={pipetteType === type.value}
                    />
                  ) : null
                })}
              </Flex>
            </Flex>
            {pipetteType != null && robotType === OT2_ROBOT_TYPE ? (
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <StyledText desktopStyle="bodyLargeSemiBold">
                  {t('pipette_gen')}
                </StyledText>
                <Flex gridGap={SPACING.spacing4}>
                  {PIPETTE_GENS.map(gen => (
                    <RadioButton
                      key={gen}
                      onChange={() => {
                        setPipetteGen(gen)
                        setPipetteVolume(null)
                        setSelectedTips([])
                      }}
                      buttonLabel={gen}
                      buttonValue={gen}
                      isSelected={pipetteGen === gen}
                    />
                  ))}
                </Flex>
              </Flex>
            ) : null}
            {(pipetteType != null && robotType === FLEX_ROBOT_TYPE) ||
            (pipetteGen !== 'flex' &&
              pipetteType != null &&
              robotType === OT2_ROBOT_TYPE) ? (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing8}
                id="volume"
              >
                <StyledText desktopStyle="bodyLargeSemiBold">
                  {t('pipette_vol')}
                </StyledText>
                <Flex gridGap={SPACING.spacing4}>
                  {PIPETTE_VOLUMES[robotType]?.map(volume => {
                    if (robotType === FLEX_ROBOT_TYPE && pipetteType != null) {
                      const flexVolume = volume as PipetteInfoByType
                      const flexPipetteInfo = flexVolume[pipetteType]

                      return flexPipetteInfo?.map(type => (
                        <RadioButton
                          key={`${type.value}_${pipetteType}`}
                          onChange={() => {
                            setPipetteVolume(type.value)
                            setSelectedTips([])
                          }}
                          buttonLabel={t('vol_label', { volume: type.label })}
                          buttonValue={type.value}
                          isSelected={pipetteVolume === type.value}
                        />
                      ))
                    } else {
                      const ot2Volume = volume as PipetteInfoByGen
                      const gen = pipetteGen as Gen

                      return ot2Volume[gen].map(info => {
                        return info[pipetteType]?.map(type => (
                          <RadioButton
                            key={`${type.value}_${pipetteGen}_${pipetteType}`}
                            onChange={() => {
                              setPipetteVolume(type.value)
                            }}
                            buttonLabel={t('vol_label', {
                              volume: type.label,
                            })}
                            buttonValue={type.value}
                            isSelected={pipetteVolume === type.value}
                          />
                        ))
                      })
                    }
                  })}
                </Flex>
              </Flex>
            ) : null}
            {allPipetteOptions.includes(selectedPip as PipetteName)
              ? (() => {
                  const tiprackOptions = getTiprackOptions({
                    allLabware,
                    allowAllTipracks,
                    selectedPipetteName: selectedPip,
                  })
                  return (
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing8}
                    >
                      <StyledText desktopStyle="bodyLargeSemiBold">
                        {t('pipette_tips')}
                      </StyledText>
                      <Box
                        css={css`
                          gap: ${SPACING.spacing4};
                          display: ${DISPLAY_FLEX};
                          flex-wrap: ${WRAP};
                          align-items: ${ALIGN_CENTER};
                          align-content: ${ALIGN_CENTER};
                          align-self: ${ALIGN_STRETCH};
                        `}
                      >
                        {tiprackOptions.map(option => (
                          <Checkbox
                            key={option.value}
                            disabled={
                              selectedTips.length === 3 &&
                              !selectedTips.includes(option.value)
                            }
                            isChecked={selectedTips.includes(option.value)}
                            labelText={removeOpentronsPhrases(option.name)}
                            onClick={() => {
                              const updatedTips = selectedTips.includes(
                                option.value
                              )
                                ? selectedTips.filter(v => v !== option.value)
                                : [...selectedTips, option.value]
                              setSelectedTips(updatedTips)
                            }}
                          />
                        ))}
                        <Flex
                          gridGap={SPACING.spacing8}
                          padding={SPACING.spacing4}
                          width={FLEX_MAX_CONTENT}
                        >
                          <StyledLabel>
                            <StyledText desktopStyle="bodyDefaultRegular">
                              {t('add_custom_tips')}
                            </StyledText>
                            <input
                              data-testid="SelectPipettes_customTipInput"
                              type="file"
                              onChange={e =>
                                dispatch(createCustomTiprackDef(e))
                              }
                            />
                          </StyledLabel>
                          {pipetteVolume === 'p1000' &&
                          robotType === FLEX_ROBOT_TYPE ? null : (
                            <Btn
                              onClick={() => {
                                dispatch(
                                  setFeatureFlags({
                                    OT_PD_ALLOW_ALL_TIPRACKS: !allowAllTipracks,
                                  })
                                )
                              }}
                              textDecoration={
                                TYPOGRAPHY.textDecorationUnderline
                              }
                            >
                              <StyledLabel>
                                <StyledText desktopStyle="bodyDefaultRegular">
                                  {allowAllTipracks
                                    ? t('show_default_tips')
                                    : t('show_all_tips')}
                                </StyledText>
                              </StyledLabel>{' '}
                            </Btn>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  )
                })()
              : null}
          </Flex>
        )}
      </Modal>
    </HandleEnter>,
    getMainPagePortalEl()
  )
}

const StyledLabel = styled.label`
  text-decoration: ${TYPOGRAPHY.textDecorationUnderline};
  font-size: ${PRODUCT.TYPOGRAPHY.fontSizeBodyDefaultSemiBold};
  display: ${DISPLAY_INLINE_BLOCK};
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
  &:hover {
    color: ${COLORS.blue50};
  }
`
