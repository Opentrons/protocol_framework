import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

import {
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
} from '@opentrons/components'

import {
  getAdditionalEquipment,
  getInitialDeckSetup,
  getPipetteEntities,
} from '../../step-forms/selectors'
import { getHas96Channel } from '../../utils'
import { getRobotType } from '../../file-data/selectors'
import { selectors as stepFormSelectors } from '../../step-forms'
import { getMainPagePortalEl } from '../Portal'
import { editPipettes } from './editPipettes'
import { HandleEnter } from '../../atoms/HandleEnter'
import { PipetteOverview } from './PipetteOverview'
import { PipetteConfiguration } from './PipetteConfiguration'
import { usePipetteConfig } from './usePipetteConfig'

import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  Gen,
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
    'shared',
  ])
  const pipetteConfig = usePipetteConfig()
  // const [page, setPage] = useState<'add' | 'overview'>('overview')
  // const [mount, setMount] = useState<PipetteMount>('left')
  // const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)
  // const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  // const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  // const [selectedTips, setSelectedTips] = useState<string[]>([])
  const robotType = useSelector(getRobotType)
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const pipetteEntities = useSelector(getPipetteEntities)
  const { pipettes, labware } = initialDeckSetup
  const pipettesOnDeck = Object.values(pipettes)
  const has96Channel = getHas96Channel(pipetteEntities)
  const leftPipette = pipettesOnDeck.find(pipette => pipette.mount === 'left')
  const rightPipette = pipettesOnDeck.find(pipette => pipette.mount === 'right')
  const gripper = Object.values(additionalEquipment).find(
    ae => ae.name === 'gripper'
  )
  const { page, mount, pipetteType, pipetteGen, pipetteVolume, selectedTips, setPage, resetFields } = pipetteConfig
  const selectedPipette =
    pipetteType === '96' || pipetteGen === 'GEN1'
      ? `${pipetteVolume}_${pipetteType}`
      : `${pipetteVolume}_${pipetteType}_${pipetteGen.toLowerCase()}`

  // const resetFields = (): void => {
  //   setPipetteType(null)
  //   setPipetteGen('flex')
  //   setPipetteVolume(null)
  // }

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
        selectedPipette as PipetteName,
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
            // setPage={setPage}
            // setMount={setMount}
            // setPipetteType={setPipetteType}
            // setPipetteGen={setPipetteGen}
            // setPipetteVolume={setPipetteVolume}
            // setSelectedTips={setSelectedTips}
            leftPipette={leftPipette}
            rightPipette={rightPipette}
            gripper={gripper}
            pipetteConfig={pipetteConfig}
          />
        ) : (
          <PipetteConfiguration
            has96Channel={has96Channel}
            robotType={robotType}
            // pipetteType={pipetteType}
            // pipetteGen={pipetteGen}
            // mount={mount}
            // pipetteVolume={pipetteVolume}
            // selectedTips={selectedTips}
            selectedPipette={selectedPipette}
            // setPipetteGen={setPipetteGen}
            // setPipetteType={setPipetteType}
            // setPipetteVolume={setPipetteVolume}
            // setSelectedTips={setSelectedTips}
            leftPipette={leftPipette}
            rightPipette={rightPipette}
            pipetteConfig={pipetteConfig}
          />
        )}
      </Modal>
    </HandleEnter>,
    getMainPagePortalEl()
  )
}
