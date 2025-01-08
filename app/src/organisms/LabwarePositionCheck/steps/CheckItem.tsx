import { useEffect } from 'react'
import isEqual from 'lodash/isEqual'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  PrepareSpace,
  JogToWell,
} from '/app/organisms/LabwarePositionCheck/shared'
import {
  FLEX_ROBOT_TYPE,
  getIsTiprack,
  getLabwareDefURI,
  getLabwareDisplayName,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'
import { getItemLabwareDef } from '/app/organisms/LabwarePositionCheck/utils'
import { getLabwareDisplayLocation } from '/app/local-resources/labware'
import { UnorderedList } from '/app/molecules/UnorderedList'
import { getCurrentOffsetForLabwareInLocation } from '/app/transformations/analysis'
import {
  setFinalPosition,
  setInitialPosition,
} from '/app/organisms/LabwarePositionCheck/redux/actions'

import type { PipetteName, LabwareDefinition2 } from '@opentrons/shared-data'
import type { CheckPositionsStep, LPCStepProps } from '../types'

export function CheckItem(
  props: LPCStepProps<CheckPositionsStep>
): JSX.Element {
  const {
    state,
    dispatch,
    proceed,
    existingOffsets,
    commandUtils,
    step,
  } = props
  const { labwareId, pipetteId, moduleId, location } = step
  const {
    handleJog,
    handlePrepModules,
    handleConfirmLwModulePlacement,
    handleConfirmLwFinalPosition,
    handleResetLwModulesOnDeck,
  } = commandUtils
  const { workingOffsets, isOnDevice, labwareDefs, protocolData } = state
  const { t } = useTranslation(['labware_position_check', 'shared'])

  // TOME TODO: Pretty mcuh all of this goes into selectors.

  const itemLabwareDef = getItemLabwareDef({
    labwareId,
    loadedLabware: protocolData.labware,
    labwareDefs,
  })
  const pipette = protocolData.pipettes.find(
    pipette => pipette.id === pipetteId
  )

  const pipetteName = pipette?.pipetteName as PipetteName

  const initialPosition = workingOffsets.find(
    o =>
      o.labwareId === labwareId &&
      isEqual(o.location, location) &&
      o.initialPosition != null
  )?.initialPosition

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

  const isLwTiprack = getIsTiprack(itemLabwareDef)
  const slotOnlyDisplayLocation = getLabwareDisplayLocation({
    location,
    detailLevel: 'slot-only',
    t,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
  })

  const existingOffset =
    getCurrentOffsetForLabwareInLocation(
      existingOffsets,
      getLabwareDefURI(itemLabwareDef) as string,
      location
    )?.vector ?? IDENTITY_VECTOR

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
          labwareDef={itemLabwareDef}
          pipetteName={pipetteName}
          handleConfirmPosition={handleDispatchConfirmFinalPlacement}
          handleGoBack={handleDispatchResetLwModulesOnDeck}
          handleJog={handleJog}
          initialPosition={initialPosition}
          existingOffset={existingOffset}
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
                  itemLabwareDef={itemLabwareDef}
                  isLwTiprack={isLwTiprack}
                  slotOnlyDisplayLocation={slotOnlyDisplayLocation}
                  {...props}
                />,
              ]}
            />
          }
          labwareDef={itemLabwareDef}
          confirmPlacement={handleDispatchConfirmInitialPlacement}
          location={step.location}
          {...props}
        />
      )}
    </Flex>
  )
}

interface PlaceItemInstructionProps extends LPCStepProps<CheckPositionsStep> {
  itemLabwareDef: LabwareDefinition2
  isLwTiprack: boolean
  slotOnlyDisplayLocation: string
}

function PlaceItemInstruction({
  step,
  itemLabwareDef,
  isLwTiprack,
  slotOnlyDisplayLocation,
  state,
}: PlaceItemInstructionProps): JSX.Element {
  const { t } = useTranslation('labware_position_check')
  const { protocolData, labwareDefs } = state
  const { location, adapterId } = step
  const labwareDisplayName = getLabwareDisplayName(itemLabwareDef)

  const displayLocation = getLabwareDisplayLocation({
    location,
    allRunDefs: labwareDefs,
    detailLevel: 'full',
    t,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
  })

  const adapterDisplayName =
    adapterId != null
      ? getItemLabwareDef({
          labwareId: adapterId,
          loadedLabware: protocolData.labware,
          labwareDefs,
        })?.metadata.displayName
      : ''

  if (isLwTiprack) {
    return (
      <Trans
        t={t}
        i18nKey="place_a_full_tip_rack_in_location"
        tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
        components={{
          bold: (
            <LegacyStyledText
              as="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  } else if (adapterId != null) {
    return (
      <Trans
        t={t}
        i18nKey="place_labware_in_adapter_in_location"
        tOptions={{
          adapter: adapterDisplayName,
          labware: labwareDisplayName,
          location: slotOnlyDisplayLocation,
        }}
        components={{
          bold: (
            <LegacyStyledText
              as="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  } else {
    return (
      <Trans
        t={t}
        i18nKey="place_labware_in_location"
        tOptions={{ labware: labwareDisplayName, location: displayLocation }}
        components={{
          bold: (
            <LegacyStyledText
              as="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  }
}
