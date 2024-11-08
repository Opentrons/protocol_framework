import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'
import { useDispatch, useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  Btn,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  ModuleIcon,
  RadioButton,
  SPACING,
  StyledText,
  Tabs,
  Toolbox,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getModuleDisplayName,
  getModuleType,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  MODULE_MODELS,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { getRobotType } from '../../../file-data/selectors'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../step-forms/actions/additionalItems'
import { createModule, deleteModule } from '../../../step-forms/actions'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import {
  createContainer,
  deleteContainer,
  editSlotInfo,
  selectFixture,
  selectLabware,
  selectModule,
  selectNestedLabware,
  selectZoomedIntoSlot,
} from '../../../labware-ingred/actions'
import { getEnableAbsorbanceReader } from '../../../feature-flags/selectors'
import { useBlockingHint } from '../../../organisms/BlockingHintModal/useBlockingHint'
import { selectors } from '../../../labware-ingred/selectors'
import { useKitchen } from '../../../organisms/Kitchen/hooks'
import { getDismissedHints } from '../../../tutorial/selectors'
import { createContainerAboveModule } from '../../../step-forms/actions/thunks'
import { ConfirmDeleteStagingAreaModal } from '../../../organisms'
import { BUTTON_LINK_STYLE } from '../../../atoms'
import { FIXTURES, MOAM_MODELS } from './constants'
import { getSlotInformation } from '../utils'
import { getModuleModelsBySlot, getDeckErrors } from './utils'
import { MagnetModuleChangeContent } from './MagnetModuleChangeContent'
import { LabwareTools } from './LabwareTools'

import type { ModuleModel } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../../types'
import type { ZoomedIntoSlotInfoState } from '../../../labware-ingred/types'
import type { Fixture } from './constants'

interface DeckSetupToolsProps {
  onCloseClick: () => void
  setHoveredLabware: (defUri: string | null) => void
  onDeckProps: {
    setHoveredModule: (model: ModuleModel | null) => void
    setHoveredFixture: (fixture: Fixture | null) => void
  } | null
}

export function DeckSetupTools(props: DeckSetupToolsProps): JSX.Element | null {
  const { onCloseClick, setHoveredLabware, onDeckProps } = props
  const { t, i18n } = useTranslation(['starting_deck_state', 'shared'])
  const { makeSnackbar } = useKitchen()
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const robotType = useSelector(getRobotType)
  const [showDeleteLabwareModal, setShowDeleteLabwareModal] = useState<
    ModuleModel | 'clear' | null
  >(null)
  const isDismissedModuleHint = useSelector(getDismissedHints).includes(
    'change_magnet_module_model'
  )
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const enableAbsorbanceReader = useSelector(getEnableAbsorbanceReader)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    selectedLabwareDefUri,
    selectedFixture,
    selectedModuleModel,
    selectedSlot,
    selectedNestedLabwareDefUri,
  } = selectedSlotInfo
  const { slot, cutout } = selectedSlot

  const initialSelectedSlotInfoRef = useRef<ZoomedIntoSlotInfoState>(
    selectedSlotInfo
  )

  // Set the initial snapshot if it hasn’t been set and `selectedSlotInfo` is fully populated
  useEffect(() => {
    // Deep clone selectedSlotInfo if necessary to avoid mutations
    initialSelectedSlotInfoRef.current = { ...selectedSlotInfo }
  }, [])

  const [changeModuleWarningInfo, displayModuleWarning] = useState<boolean>(
    false
  )
  const [selectedHardware, setSelectedHardware] = useState<
    ModuleModel | Fixture | null
  >(null)

  //  initialize the previously selected hardware because for some reason it does not
  //  work initiating it in the above useState
  useEffect(() => {
    if (selectedModuleModel !== null || selectedFixture != null) {
      setSelectedHardware(selectedModuleModel ?? selectedFixture ?? null)
    }
  }, [selectedModuleModel, selectedFixture])

  const moduleModels =
    slot != null
      ? getModuleModelsBySlot(enableAbsorbanceReader, robotType, slot)
      : null
  const [tab, setTab] = useState<'hardware' | 'labware'>(
    moduleModels?.length === 0 || slot === 'offDeck' ? 'labware' : 'hardware'
  )
  const hasMagneticModule = Object.values(deckSetup.modules).some(
    module => module.type === MAGNETIC_MODULE_TYPE
  )
  const moduleOnSlotIsMagneticModuleV1 =
    Object.values(deckSetup.modules).find(module => module.slot === slot)
      ?.model === MAGNETIC_MODULE_V1

  const changeModuleWarning = useBlockingHint({
    hintKey: 'change_magnet_module_model',
    handleCancel: () => {
      displayModuleWarning(false)
    },
    handleContinue: () => {
      setSelectedHardware(
        moduleOnSlotIsMagneticModuleV1 ? MAGNETIC_MODULE_V2 : MAGNETIC_MODULE_V1
      )
      dispatch(
        selectModule({
          moduleModel: moduleOnSlotIsMagneticModuleV1
            ? MAGNETIC_MODULE_V2
            : MAGNETIC_MODULE_V1,
        })
      )
      displayModuleWarning(false)
    },
    content: <MagnetModuleChangeContent />,
    enabled: changeModuleWarningInfo,
  })

  if (slot == null || (onDeckProps == null && slot !== 'offDeck')) {
    return null
  }

  const {
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
    labware: deckSetupLabware,
  } = deckSetup
  const hasTrash = Object.values(additionalEquipmentOnDeck).some(
    ae => ae.name === 'trashBin'
  )

  const {
    createdNestedLabwareForSlot,
    createdModuleForSlot,
    createdLabwareForSlot,
    createFixtureForSlots,
    matchingLabwareFor4thColumn,
  } = getSlotInformation({ deckSetup, slot })

  let fixtures: Fixture[] = []
  if (slot === 'D3') {
    fixtures = FIXTURES
  } else if (['A3', 'B3', 'C3'].includes(slot)) {
    fixtures = ['stagingArea', 'trashBin']
  } else if (['A1', 'B1', 'C1', 'D1'].includes(slot)) {
    fixtures = ['trashBin']
  }

  const hardwareTab = {
    text: t('deck_hardware'),
    disabled: moduleModels?.length === 0,
    isActive: tab === 'hardware',
    onClick: () => {
      setTab('hardware')
    },
  }
  const labwareTab = {
    text: t('labware'),
    disabled:
      selectedFixture === 'wasteChute' ||
      selectedFixture === 'wasteChuteAndStagingArea' ||
      selectedFixture === 'trashBin',
    isActive: tab === 'labware',
    onClick: () => {
      setTab('labware')
    },
  }

  const handleResetToolbox = (): void => {
    dispatch(
      editSlotInfo({
        createdNestedLabwareForSlot: null,
        createdLabwareForSlot: null,
        createdModuleForSlot: null,
        preSelectedFixture: null,
      })
    )
  }

  const handleClear = (): void => {
    onDeckProps?.setHoveredModule(null)
    onDeckProps?.setHoveredFixture(null)
    if (slot !== 'offDeck') {
      //  clear module from slot
      if (createdModuleForSlot != null) {
        dispatch(deleteModule(createdModuleForSlot.id))
      }
      //  clear fixture(s) from slot
      if (createFixtureForSlots != null && createFixtureForSlots.length > 0) {
        createFixtureForSlots.forEach(fixture =>
          dispatch(deleteDeckFixture(fixture.id))
        )
      }
      //  clear labware from slot
      if (createdLabwareForSlot != null) {
        dispatch(deleteContainer({ labwareId: createdLabwareForSlot.id }))
      }
      //  clear nested labware from slot
      if (createdNestedLabwareForSlot != null) {
        dispatch(deleteContainer({ labwareId: createdNestedLabwareForSlot.id }))
      }
      // clear labware on staging area 4th column slot
      if (matchingLabwareFor4thColumn != null) {
        dispatch(deleteContainer({ labwareId: matchingLabwareFor4thColumn.id }))
      }
    }
    handleResetToolbox()
    setSelectedHardware(null)
  }
  console.log(
    isEqual(selectedSlotInfo, initialSelectedSlotInfoRef.current),
    selectedSlotInfo,
    initialSelectedSlotInfoRef.current
  )
  const handleConfirm = (): void => {
    //  only update info if user changed what was previously selected
    if (!isEqual(selectedSlotInfo, initialSelectedSlotInfoRef.current)) {
      //  clear entities first before recreating them
      handleClear()

      if (selectedFixture != null && cutout != null) {
        //  create fixture(s)
        if (selectedFixture === 'wasteChuteAndStagingArea') {
          dispatch(createDeckFixture('wasteChute', cutout))
          dispatch(createDeckFixture('stagingArea', cutout))
        } else {
          dispatch(createDeckFixture(selectedFixture, cutout))
        }
      }
      if (selectedModuleModel != null) {
        //  create module
        dispatch(
          createModule({
            slot,
            type: getModuleType(selectedModuleModel),
            model: selectedModuleModel,
          })
        )
      }
      if (selectedModuleModel == null && selectedLabwareDefUri != null) {
        //  create adapter + labware on deck
        dispatch(
          createContainer({
            slot,
            labwareDefURI:
              selectedNestedLabwareDefUri == null
                ? selectedLabwareDefUri
                : selectedNestedLabwareDefUri,
            adapterUnderLabwareDefURI:
              selectedNestedLabwareDefUri == null
                ? undefined
                : selectedLabwareDefUri,
          })
        )
      }
      if (selectedModuleModel != null && selectedLabwareDefUri != null) {
        //   create adapter + labware on module
        dispatch(
          createContainerAboveModule({
            slot,
            labwareDefURI: selectedLabwareDefUri,
            nestedLabwareDefURI: selectedNestedLabwareDefUri ?? undefined,
          })
        )
      }
      handleResetToolbox()
      dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
      onCloseClick()
    } else {
      dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
      onCloseClick()
    }
  }
  return (
    <>
      {showDeleteLabwareModal != null ? (
        <ConfirmDeleteStagingAreaModal
          onClose={() => {
            setShowDeleteLabwareModal(null)
          }}
          onConfirm={() => {
            if (showDeleteLabwareModal === 'clear') {
              handleClear()
              handleResetToolbox()
            } else if (MODULE_MODELS.includes(showDeleteLabwareModal)) {
              setSelectedHardware(showDeleteLabwareModal)
              dispatch(selectFixture({ fixture: null }))
              dispatch(selectModule({ moduleModel: showDeleteLabwareModal }))
              dispatch(selectLabware({ labwareDefUri: null }))
              dispatch(selectNestedLabware({ nestedLabwareDefUri: null }))
            }
            setShowDeleteLabwareModal(null)
          }}
        />
      ) : null}
      {changeModuleWarning}
      <Toolbox
        height="calc(100vh - 64px)"
        width="23.375rem"
        title={
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <DeckInfoLabel
              deckLabel={
                slot === 'offDeck'
                  ? i18n.format(t('off_deck_title'), 'upperCase')
                  : slot
              }
            />
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('customize_slot')}
            </StyledText>
          </Flex>
        }
        secondaryHeaderButton={
          <Btn
            onClick={() => {
              if (matchingLabwareFor4thColumn != null) {
                setShowDeleteLabwareModal('clear')
              } else {
                handleClear()
                handleResetToolbox()
              }
            }}
            css={BUTTON_LINK_STYLE}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('clear')}
            </StyledText>
          </Btn>
        }
        closeButton={<Icon size="2rem" name="close" />}
        onCloseClick={onCloseClick}
        onConfirmClick={handleConfirm}
        confirmButtonText={t('done')}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          {slot !== 'offDeck' ? (
            <Tabs tabs={[hardwareTab, labwareTab]} />
          ) : null}
          {tab === 'hardware' ? (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <StyledText desktopStyle="bodyDefaultSemiBold">
                  {t('add_module')}
                </StyledText>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                >
                  {moduleModels?.map(model => {
                    const modelSomewhereOnDeck = Object.values(
                      deckSetupModules
                    ).filter(
                      module => module.model === model && module.slot !== slot
                    )
                    const typeSomewhereOnDeck = Object.values(
                      deckSetupModules
                    ).filter(
                      module =>
                        module.type === getModuleType(model) &&
                        module.slot !== slot
                    )
                    const moamModels = MOAM_MODELS

                    const collisionError = getDeckErrors({
                      modules: deckSetupModules,
                      selectedSlot: slot,
                      selectedModel: model,
                      labware: deckSetupLabware,
                      robotType,
                    })

                    return (
                      <RadioButton
                        setNoHover={() => {
                          if (onDeckProps?.setHoveredModule != null) {
                            onDeckProps.setHoveredModule(null)
                          }
                        }}
                        setHovered={() => {
                          if (onDeckProps?.setHoveredModule != null) {
                            onDeckProps.setHoveredModule(model)
                          }
                        }}
                        largeDesktopBorderRadius
                        buttonLabel={
                          <Flex
                            gridGap={SPACING.spacing4}
                            alignItems={ALIGN_CENTER}
                          >
                            <ModuleIcon
                              size="1rem"
                              moduleType={getModuleType(model)}
                            />
                            <StyledText desktopStyle="bodyDefaultRegular">
                              {getModuleDisplayName(model)}
                            </StyledText>
                          </Flex>
                        }
                        key={`${model}_${slot}`}
                        buttonValue={model}
                        onChange={() => {
                          if (
                            modelSomewhereOnDeck.length === 1 &&
                            !moamModels.includes(model) &&
                            robotType === FLEX_ROBOT_TYPE
                          ) {
                            makeSnackbar(
                              t('one_item', {
                                hardware: getModuleDisplayName(model),
                              }) as string
                            )
                          } else if (
                            typeSomewhereOnDeck.length > 0 &&
                            robotType === OT2_ROBOT_TYPE
                          ) {
                            makeSnackbar(
                              t('one_item', {
                                hardware: t(
                                  `shared:${getModuleType(model).toLowerCase()}`
                                ),
                              }) as string
                            )
                          } else if (collisionError != null) {
                            makeSnackbar(t(`${collisionError}`) as string)
                          } else if (
                            hasMagneticModule &&
                            (model === 'magneticModuleV1' ||
                              model === 'magneticModuleV2') &&
                            !isDismissedModuleHint
                          ) {
                            displayModuleWarning(true)
                          } else if (
                            selectedFixture === 'stagingArea' ||
                            (selectedFixture === 'wasteChuteAndStagingArea' &&
                              matchingLabwareFor4thColumn != null)
                          ) {
                            setShowDeleteLabwareModal(model)
                          } else {
                            setSelectedHardware(model)
                            dispatch(selectFixture({ fixture: null }))
                            dispatch(selectModule({ moduleModel: model }))
                            dispatch(selectLabware({ labwareDefUri: null }))
                            dispatch(
                              selectNestedLabware({ nestedLabwareDefUri: null })
                            )
                          }
                        }}
                        isSelected={model === selectedHardware}
                      />
                    )
                  })}
                </Flex>
              </Flex>
              {robotType === OT2_ROBOT_TYPE || fixtures.length === 0 ? null : (
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing8}
                >
                  <StyledText desktopStyle="bodyDefaultSemiBold">
                    {t('add_fixture')}
                  </StyledText>
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing4}
                  >
                    {fixtures.map(fixture => (
                      <RadioButton
                        setNoHover={() => {
                          if (onDeckProps?.setHoveredFixture != null) {
                            onDeckProps.setHoveredFixture(null)
                          }
                        }}
                        setHovered={() => {
                          if (onDeckProps?.setHoveredFixture != null) {
                            onDeckProps.setHoveredFixture(fixture)
                          }
                        }}
                        largeDesktopBorderRadius
                        buttonLabel={t(`shared:${fixture}`)}
                        key={`${fixture}_${slot}`}
                        buttonValue={fixture}
                        onChange={() => {
                          //    delete this when multiple trash bins are supported
                          if (fixture === 'trashBin' && hasTrash) {
                            makeSnackbar(
                              t('one_item', {
                                hardware: t('shared:trashBin'),
                              }) as string
                            )
                          } else {
                            setSelectedHardware(fixture)
                            dispatch(selectModule({ moduleModel: null }))
                            dispatch(selectFixture({ fixture }))
                            dispatch(selectLabware({ labwareDefUri: null }))
                            dispatch(
                              selectNestedLabware({ nestedLabwareDefUri: null })
                            )
                          }
                        }}
                        isSelected={fixture === selectedHardware}
                      />
                    ))}
                  </Flex>
                </Flex>
              )}
            </Flex>
          ) : (
            <LabwareTools setHoveredLabware={setHoveredLabware} slot={slot} />
          )}
        </Flex>
      </Toolbox>
    </>
  )
}
