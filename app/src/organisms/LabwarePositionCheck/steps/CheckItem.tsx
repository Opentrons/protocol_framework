import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import isEqual from 'lodash/isEqual'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  RobotMotionLoader,
  PrepareSpace,
  JogToWell,
} from '/app/organisms/LabwarePositionCheck/shared'
import {
  FLEX_ROBOT_TYPE,
  getIsTiprack,
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  IDENTITY_VECTOR,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { getItemLabwareDef } from '/app/organisms/LabwarePositionCheck/utils'
import { getLabwareDisplayLocation } from '/app/local-resources/labware'
import { UnorderedList } from '/app/molecules/UnorderedList'
import { getCurrentOffsetForLabwareInLocation } from '/app/transformations/analysis'
import { getIsOnDevice } from '/app/redux/config'
import {
  setFinalPosition,
  setInitialPosition,
} from '/app/organisms/LabwarePositionCheck/redux/actions'

import type {
  CreateCommand,
  LabwareLocation,
  MoveLabwareCreateCommand,
  PipetteName,
} from '@opentrons/shared-data'
import type { CheckPositionsStep, LPCStepProps } from '../types'

const PROBE_LENGTH_MM = 44.5

export function CheckItem(
  props: LPCStepProps<CheckPositionsStep>
): JSX.Element {
  const {
    step,
    protocolData,
    chainRunCommands,
    state,
    dispatch,
    proceed,
    handleJog,
    isRobotMoving,
    existingOffsets,
    setErrorMessage,
    labwareDefs,
  } = props
  const { labwareId, pipetteId, moduleId, adapterId, location } = step
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { workingOffsets } = state
  const isOnDevice = useSelector(getIsOnDevice)
  const labwareDef = getItemLabwareDef({
    labwareId,
    loadedLabware: protocolData.labware,
    labwareDefs,
  })
  const pipette = protocolData.pipettes.find(
    pipette => pipette.id === pipetteId
  )
  const adapterDisplayName =
    adapterId != null
      ? getItemLabwareDef({
          labwareId: adapterId,
          loadedLabware: protocolData.labware,
          labwareDefs,
        })?.metadata.displayName
      : ''

  const pipetteMount = pipette?.mount
  const pipetteName = pipette?.pipetteName as PipetteName
  let modulePrepCommands: CreateCommand[] = []
  const moduleType =
    (moduleId != null &&
      'moduleModel' in location &&
      location.moduleModel != null &&
      getModuleType(location.moduleModel)) ??
    null
  if (moduleId != null && moduleType === THERMOCYCLER_MODULE_TYPE) {
    modulePrepCommands = [
      {
        commandType: 'thermocycler/openLid',
        params: { moduleId },
      },
    ]
  } else if (moduleId != null && moduleType === HEATERSHAKER_MODULE_TYPE) {
    modulePrepCommands = [
      {
        commandType: 'heaterShaker/closeLabwareLatch',
        params: { moduleId },
      },
      {
        commandType: 'heaterShaker/deactivateShaker',
        params: { moduleId },
      },
      {
        commandType: 'heaterShaker/openLabwareLatch',
        params: { moduleId },
      },
    ]
  }
  const initialPosition = workingOffsets.find(
    o =>
      o.labwareId === labwareId &&
      isEqual(o.location, location) &&
      o.initialPosition != null
  )?.initialPosition

  useEffect(() => {
    if (initialPosition == null && modulePrepCommands.length > 0) {
      chainRunCommands(modulePrepCommands, false)
        .then(() => {})
        .catch((e: Error) => {
          setErrorMessage(
            `CheckItem module prep commands failed with message: ${e?.message}`
          )
        })
    }
  }, [moduleId])

  // TOME TODO: Error instead of returning null.
  // if (pipetteName == null || labwareDef == null || pipetteMount == null)
  //   return null

  const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
    pipetteMount === 'left' ? 'leftZ' : 'rightZ'
  const isTiprack = getIsTiprack(labwareDef)
  const displayLocation = getLabwareDisplayLocation({
    location,
    allRunDefs: labwareDefs,
    detailLevel: 'full',
    t,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
  })
  const slotOnlyDisplayLocation = getLabwareDisplayLocation({
    location,
    detailLevel: 'slot-only',
    t,
    loadedModules: protocolData.modules,
    loadedLabwares: protocolData.labware,
    robotType: FLEX_ROBOT_TYPE,
  })

  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  let placeItemInstruction: JSX.Element = (
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

  if (isTiprack) {
    placeItemInstruction = (
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
    placeItemInstruction = (
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
  }

  let newLocation: LabwareLocation
  if (moduleId != null) {
    newLocation = { moduleId }
  } else {
    newLocation = { slotName: location.slotName }
  }

  let moveLabware: MoveLabwareCreateCommand[]
  if (adapterId != null) {
    moveLabware = [
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId: adapterId,
          newLocation,
          strategy: 'manualMoveWithoutPause',
        },
      },
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId,
          newLocation:
            adapterId != null
              ? { labwareId: adapterId }
              : { slotName: location.slotName },
          strategy: 'manualMoveWithoutPause',
        },
      },
    ]
  } else {
    moveLabware = [
      {
        commandType: 'moveLabware' as const,
        params: {
          labwareId,
          newLocation,
          strategy: 'manualMoveWithoutPause',
        },
      },
    ]
  }
  const handleConfirmPlacement = (): void => {
    chainRunCommands(
      [
        ...moveLabware,
        ...protocolData.modules.reduce<CreateCommand[]>((acc, mod) => {
          if (getModuleType(mod.model) === HEATERSHAKER_MODULE_TYPE) {
            return [
              ...acc,
              {
                commandType: 'heaterShaker/closeLabwareLatch',
                params: { moduleId: mod.id },
              },
            ]
          }
          return acc
        }, []),
        {
          commandType: 'moveToWell' as const,
          params: {
            pipetteId,
            labwareId,
            wellName: 'A1',
            wellLocation: {
              origin: 'top' as const,
              offset: { x: 0, y: 0, z: PROBE_LENGTH_MM },
            },
          },
        },
        { commandType: 'savePosition', params: { pipetteId } },
      ],
      false
    )
      .then(responses => {
        const finalResponse = responses[responses.length - 1]
        if (finalResponse.data.commandType === 'savePosition') {
          const { position } = finalResponse.data?.result ?? { position: null }
          dispatch(
            setInitialPosition({
              labwareId,
              location,
              position,
            })
          )
        } else {
          setErrorMessage(
            `CheckItem failed to save position for initial placement.`
          )
        }
      })
      .catch((e: Error) => {
        setErrorMessage(
          `CheckItem failed to save position for initial placement with message: ${e.message}`
        )
      })
  }
  const moveLabwareOffDeck: CreateCommand[] =
    adapterId != null
      ? [
          {
            commandType: 'moveLabware' as const,
            params: {
              labwareId,
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
          {
            commandType: 'moveLabware' as const,
            params: {
              labwareId: adapterId,
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
        ]
      : [
          {
            commandType: 'moveLabware' as const,
            params: {
              labwareId,
              newLocation: 'offDeck',
              strategy: 'manualMoveWithoutPause',
            },
          },
        ]

  const handleConfirmPosition = (): void => {
    const heaterShakerPrepCommands: CreateCommand[] =
      moduleId != null &&
      moduleType != null &&
      moduleType === HEATERSHAKER_MODULE_TYPE
        ? [
            {
              commandType: 'heaterShaker/openLabwareLatch',
              params: { moduleId },
            },
          ]
        : []
    const confirmPositionCommands: CreateCommand[] = [
      {
        commandType: 'retractAxis' as const,
        params: {
          axis: pipetteZMotorAxis,
        },
      },
      {
        commandType: 'retractAxis' as const,
        params: { axis: 'x' },
      },
      {
        commandType: 'retractAxis' as const,
        params: { axis: 'y' },
      },
      ...heaterShakerPrepCommands,
      ...moveLabwareOffDeck,
    ]

    chainRunCommands(
      [
        { commandType: 'savePosition', params: { pipetteId } },
        ...confirmPositionCommands,
      ],
      false
    )
      .then(responses => {
        const firstResponse = responses[0]
        if (firstResponse.data.commandType === 'savePosition') {
          const { position } = firstResponse.data?.result ?? { position: null }
          dispatch(
            setFinalPosition({
              labwareId,
              location,
              position,
            })
          )
          proceed()
        } else {
          setErrorMessage(
            'CheckItem failed to save final position with message'
          )
        }
      })
      .catch((e: Error) => {
        setErrorMessage(
          `CheckItem failed to move from final position with message: ${e.message}`
        )
      })
  }
  const handleGoBack = (): void => {
    chainRunCommands(
      [
        ...modulePrepCommands,
        { commandType: 'home', params: {} },
        ...moveLabwareOffDeck,
      ],
      false
    )
      .then(() => {
        dispatch(
          setInitialPosition({
            labwareId,
            location,
            position: null,
          })
        )
      })
      .catch((e: Error) => {
        setErrorMessage(`CheckItem failed to home: ${e.message}`)
      })
  }

  const existingOffset =
    getCurrentOffsetForLabwareInLocation(
      existingOffsets,
      getLabwareDefURI(labwareDef),
      location
    )?.vector ?? IDENTITY_VECTOR

  if (isRobotMoving)
    return (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )
  return (
    <Flex flexDirection={DIRECTION_COLUMN} minHeight="29.5rem">
      {initialPosition != null ? (
        <JogToWell
          {...props}
          header={t('check_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
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
                item_location: isTiprack
                  ? t('check_tip_location')
                  : t('check_well_location'),
              }}
              components={{
                block: <LegacyStyledText as="p" />,
                bold: <strong />,
              }}
            />
          }
          labwareDef={labwareDef}
          pipetteName={pipetteName}
          handleConfirmPosition={handleConfirmPosition}
          handleGoBack={handleGoBack}
          handleJog={handleJog}
          initialPosition={initialPosition}
          existingOffset={existingOffset}
        />
      ) : (
        <PrepareSpace
          {...props}
          header={t('prepare_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
            location: slotOnlyDisplayLocation,
          })}
          body={
            <UnorderedList
              items={[
                isOnDevice ? t('clear_all_slots_odd') : t('clear_all_slots'),
                placeItemInstruction,
              ]}
            />
          }
          labwareDef={labwareDef}
          confirmPlacement={handleConfirmPlacement}
          location={step.location}
        />
      )}
    </Flex>
  )
}
