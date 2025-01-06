import { useEffect } from 'react'
import omit from 'lodash/omit'
import isEqual from 'lodash/isEqual'
import { Trans, useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import {
  getIsTiprack,
  getLabwareDefURI,
  getLabwareDisplayName,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  IDENTITY_VECTOR,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { useSelector } from 'react-redux'
import { getLabwareDef } from './utils/labware'
import { getLabwareDefinitionsFromCommands } from '/app/local-resources/labware'
import { UnorderedList } from '/app/molecules/UnorderedList'
import { getCurrentOffsetForLabwareInLocation } from '/app/transformations/analysis'
import { getIsOnDevice } from '/app/redux/config'
import { getDisplayLocation } from './utils/getDisplayLocation'
import {
  setFinalPosition,
  setInitialPosition,
} from '/app/organisms/LabwarePositionCheck/redux/actions'

import type {
  CreateCommand,
  LabwareLocation,
  MoveLabwareCreateCommand,
} from '@opentrons/shared-data'
import type {
  CheckLabwareStep,
  CheckPositionsStep,
  CheckTipRacksStep,
  LPCStepProps,
} from './types'
import type { TFunction } from 'i18next'

const PROBE_LENGTH_MM = 44.5

// TOME TODO: Get rid of the 'null' or jsx here.
export function CheckItem(
  props: LPCStepProps<CheckLabwareStep | CheckPositionsStep | CheckTipRacksStep>
): JSX.Element | null {
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
  } = props
  const { labwareId, pipetteId, moduleId, adapterId, location } = step
  const { t, i18n } = useTranslation(['labware_position_check', 'shared'])
  const { workingOffsets } = state
  const isOnDevice = useSelector(getIsOnDevice)
  const labwareDef = getLabwareDef(labwareId, protocolData)
  const pipette = protocolData.pipettes.find(
    pipette => pipette.id === pipetteId
  )
  const adapterDisplayName =
    adapterId != null
      ? getLabwareDef(adapterId, protocolData)?.metadata.displayName
      : ''

  const pipetteMount = pipette?.mount
  const pipetteName = pipette?.pipetteName
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

  if (pipetteName == null || labwareDef == null || pipetteMount == null)
    return null

  const labwareDefs = getLabwareDefinitionsFromCommands(protocolData.commands)
  const pipetteZMotorAxis: 'leftZ' | 'rightZ' =
    pipetteMount === 'left' ? 'leftZ' : 'rightZ'
  const isTiprack = getIsTiprack(labwareDef)
  const displayLocation = getDisplayLocation(
    location,
    labwareDefs,
    t as TFunction,
    i18n
  )
  const slotOnlyDisplayLocation = getDisplayLocation(
    location,
    labwareDefs,
    t as TFunction,
    i18n,
    true
  )
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
          location: getDisplayLocation(
            omit(location, ['definitionUri']), // only want the adapter's location here
            labwareDefs,
            t as TFunction,
            i18n
          ),
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
