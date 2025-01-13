import { useEffect } from 'react'
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

export function CheckItem(
  props: LPCStepProps<CheckPositionsStep>
): JSX.Element {
  const { state, dispatch, proceed, commandUtils, step } = props
  const { labwareId, moduleId, location } = step
  const {
    handleJog,
    handlePrepModules,
    handleConfirmLwModulePlacement,
    handleConfirmLwFinalPosition,
    handleResetLwModulesOnDeck,
  } = commandUtils
  const { isOnDevice, protocolData } = state
  const { t } = useTranslation(['labware_position_check', 'shared'])

  const pipette = selectActivePipette(state)
  const initialPosition = selectActiveLwInitialPosition(state)
  const isLwTiprack = selectIsActiveLwTipRack(state)
  const slotOnlyDisplayLocation = getLabwareDisplayLocation({
    location,
    detailLevel: 'slot-only',
    t,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
  })

  useEffect(() => {
    handlePrepModules({ step, initialPosition })
  }, [moduleId])

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

  const handleDispatchConfirmFinalPlacement = (): void => {
    void handleConfirmLwFinalPosition({
      step,
      onSuccess: proceed,
      pipette,
    }).then(position => {
      dispatch(
        setFinalPosition({
          labwareId,
          location,
          position,
        })
      )
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
