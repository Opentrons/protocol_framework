import { Trans, useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, LegacyStyledText } from '@opentrons/components'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { getLabwareDisplayLocation } from '/app/local-resources/labware'
import { UnorderedList } from '/app/molecules/UnorderedList'
import {
  setFinalPosition,
  setInitialPosition,
} from '/app/organisms/LabwarePositionCheck/redux/actions'
import { JogToWell } from './JogToWell'
import { PrepareSpace } from './PrepareSpace'
import { PlaceItemInstruction } from './PlaceItemInstruction'
import {
  selectActiveLwInitialPosition,
  selectActivePipette,
  selectIsActiveLwTipRack,
} from '/app/organisms/LabwarePositionCheck/redux'

import type {
  CheckPositionsStep,
  LPCStepProps,
} from '/app/organisms/LabwarePositionCheck/types'
import type { DisplayLocationParams } from '/app/local-resources/labware'

export function CheckItem(
  props: LPCStepProps<CheckPositionsStep>
): JSX.Element {
  const { state, dispatch, proceed, commandUtils, step } = props
  const { labwareId, location } = step
  const {
    handleJog,
    handleCheckItemsPrepModules,
    handleConfirmLwModulePlacement,
    handleConfirmLwFinalPosition,
    handleResetLwModulesOnDeck,
    handleValidMoveToMaintenancePosition,
  } = commandUtils
  const { isOnDevice, protocolData, labwareDefs, steps } = state
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { t: commandTextT } = useTranslation('protocol_command_text')

  const pipette = selectActivePipette(step, state)
  const initialPosition = selectActiveLwInitialPosition(step, state)
  const isLwTiprack = selectIsActiveLwTipRack(state)

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

  const handleDispatchConfirmInitialPlacement = (): void => {
    void handleConfirmLwModulePlacement({ step }).then(position => {
      dispatch(
        setInitialPosition({
          labwareId,
          location,
          position,
        })
      )
    })
  }

  // TODO(jh, 01-14-25): Revisit next step injection after refactoring the store (after designs settle).
  const handleDispatchConfirmFinalPlacement = (): void => {
    void handleConfirmLwFinalPosition({
      step,
      onSuccess: proceed,
      pipette,
    })
      .then(position => {
        dispatch(
          setFinalPosition({
            labwareId,
            location,
            position,
          })
        )
      })
      .then(() => {
        handleCheckItemsPrepModules(steps.next)
      })
      .then(() => {
        handleValidMoveToMaintenancePosition(steps.next)
      })
  }

  const handleDispatchResetLwModulesOnDeck = (): void => {
    void handleResetLwModulesOnDeck({ step }).then(() => {
      dispatch(
        setInitialPosition({
          labwareId,
          location,
          position: null,
        })
      )
    })
  }

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
          handleConfirmPosition={handleDispatchConfirmFinalPlacement}
          handleGoBack={handleDispatchResetLwModulesOnDeck}
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
          confirmPlacement={handleDispatchConfirmInitialPlacement}
          {...props}
        />
      )}
    </Flex>
  )
}
