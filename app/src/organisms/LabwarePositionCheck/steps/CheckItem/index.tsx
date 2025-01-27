import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  getLabwareDisplayLocation,
} from '@opentrons/components'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { UnorderedList } from '/app/molecules/UnorderedList'
import {
  setFinalPosition,
  setInitialPosition,
} from '/app/redux/protocol-runs/actions'
import { JogToWell } from './JogToWell'
import { PrepareSpace } from './PrepareSpace'
import { PlaceItemInstruction } from './PlaceItemInstruction'
import {
  selectActiveLwInitialPosition,
  selectActivePipette,
  selectIsActiveLwTipRack,
} from '/app/redux/protocol-runs'
import { getIsOnDevice } from '/app/redux/config'

import type { DisplayLocationParams } from '@opentrons/components'
import type { State } from '/app/redux/types'
import type { LPCWizardState } from '/app/redux/protocol-runs'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

export function CheckItem(props: LPCWizardContentProps): JSX.Element {
  const { runId, proceed, commandUtils } = props
  const {
    handleJog,
    handleCheckItemsPrepModules,
    handleConfirmLwModulePlacement,
    handleConfirmLwFinalPosition,
    handleResetLwModulesOnDeck,
    handleValidMoveToMaintenancePosition,
    toggleRobotMoving,
  } = commandUtils
  const dispatch = useDispatch()

  const isOnDevice = useSelector(getIsOnDevice)
  const { protocolData, labwareDefs, steps } = useSelector(
    (state: State) => state.protocolRuns[runId]?.lpc as LPCWizardState
  )
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { t: commandTextT } = useTranslation('protocol_command_text')

  const pipette = useSelector(selectActivePipette(runId))
  const initialPosition = useSelector(selectActiveLwInitialPosition(runId))
  const isLwTiprack = useSelector(selectIsActiveLwTipRack(runId))

  const buildDisplayParams = (): Omit<
    DisplayLocationParams,
    'detailLevel'
  > => ({
    t: commandTextT,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
    location,
  })

  const slotOnlyDisplayLocation = getLabwareDisplayLocation({
    detailLevel: 'slot-only',
    ...buildDisplayParams(),
  })
  const fullDisplayLocation = getLabwareDisplayLocation({
    detailLevel: 'full',
    allRunDefs: labwareDefs,
    ...buildDisplayParams(),
  })

  const handlePrepareProceed = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleConfirmLwModulePlacement({ step }))
      .then(position => {
        dispatch(
          setInitialPosition(runId, {
            labwareId,
            location,
            position,
          })
        )
      })
      .finally(() => toggleRobotMoving(false))
  }

  // TODO(jh, 01-14-25): Revisit next step injection after refactoring the store (after designs settle).
  const handleJogProceed = (): void => {
    void toggleRobotMoving(true)
      .then(() =>
        handleConfirmLwFinalPosition({
          step,
          onSuccess: proceed,
          pipette,
        })
      )
      .then(position => {
        dispatch(
          setFinalPosition(runId, {
            labwareId,
            location,
            position,
          })
        )
      })
      .then(() => {
        if (steps.next?.section === STEP.CHECK_POSITIONS) {
          return handleCheckItemsPrepModules(steps.next)
        } else {
          return handleValidMoveToMaintenancePosition(pipette, steps.next)
        }
      })
      .finally(() => toggleRobotMoving(false))
  }

  const handleGoBack = (): void => {
    void toggleRobotMoving(true)
      .then(() => handleResetLwModulesOnDeck({ step }))
      .then(() => {
        dispatch(
          setInitialPosition(runId, {
            labwareId,
            location,
            position: null,
          })
        )
      })
      .finally(() => toggleRobotMoving(false))
  }

  // TODO(jh 01-15-24): These should be separate steps, but let's wait for designs to settle.
  return (
    <Flex flexDirection={DIRECTION_COLUMN} minHeight="29.5rem">
      {initialPosition != null ? (
        <JogToWell
          header={t('check_item_in_location', {
            item: isLwTiprack ? t('tip_rack') : t('labware'),
            location: slotOnlyDisplayLocation,
          })}
          body={
            <Trans
              t={t}
              i18nKey={
                isOnDevice
                  ? 'ensure_nozzle_position_odd'
                  : 'ensure_nozzle_position_desktop'
              }
              values={{
                tip_type: t('calibration_probe'),
                item_location: isLwTiprack
                  ? t('check_tip_location')
                  : t('check_well_location'),
              }}
              components={{
                block: <LegacyStyledText as="p" />,
                bold: <strong />,
              }}
            />
          }
          handleConfirmPosition={handleJogProceed}
          handleGoBack={handleGoBack}
          handleJog={handleJog}
          {...props}
        />
      ) : (
        <PrepareSpace
          header={t('prepare_item_in_location', {
            item: isLwTiprack ? t('tip_rack') : t('labware'),
            location: slotOnlyDisplayLocation,
          })}
          body={
            <UnorderedList
              items={[
                isOnDevice ? t('clear_all_slots_odd') : t('clear_all_slots'),
                <PlaceItemInstruction
                  key={slotOnlyDisplayLocation}
                  isLwTiprack={isLwTiprack}
                  slotOnlyDisplayLocation={slotOnlyDisplayLocation}
                  fullDisplayLocation={fullDisplayLocation}
                  {...props}
                />,
              ]}
            />
          }
          confirmPlacement={handlePrepareProceed}
          {...props}
        />
      )}
    </Flex>
  )
}
