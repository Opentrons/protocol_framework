import * as React from 'react'
import values from 'lodash/values'

import { Module } from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getLabwareHasQuirk,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { LabwareOnDeck } from '../../components/DeckSetup/LabwareOnDeck'
import { getStagingAreaAddressableAreas } from '../../utils'
import { getSlotIdsBlockedBySpanningForThermocycler } from '../../step-forms'
import { SlotHover } from './SlotHover'
import type {
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type {
  InitialDeckSetup,
  ModuleOnDeck,
  LabwareOnDeck as LabwareOnDeckType,
} from '../../step-forms'

interface DeckSetupDetailsProps {
  initialDeckSetup: InitialDeckSetup
  deckDef: DeckDefinition
  stagingAreaCutoutIds: CutoutId[]
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  robotType: RobotType
}

export const DeckThumbnailDetails = (
  props: DeckSetupDetailsProps
): JSX.Element => {
  const {
    initialDeckSetup,
    deckDef,
    stagingAreaCutoutIds,
    robotType,
    hover,
    setHover,
  } = props
  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanningForThermocycler(
    initialDeckSetup,
    robotType
  )

  const allLabware: LabwareOnDeckType[] = Object.keys(
    initialDeckSetup.labware
  ).reduce<LabwareOnDeckType[]>((acc, labwareId) => {
    const labware = initialDeckSetup.labware[labwareId]
    return getLabwareHasQuirk(labware.def, 'fixedTrash')
      ? acc
      : [...acc, labware]
  }, [])

  const allModules: ModuleOnDeck[] = values(initialDeckSetup.modules)

  return (
    <>
      {/* all modules */}
      {allModules.map(moduleOnDeck => {
        const slotId = moduleOnDeck.slot

        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slotId} for module ${moduleOnDeck.id}`)
          return null
        }
        const moduleDef = getModuleDef2(moduleOnDeck.model)
        const labwareLoadedOnModule = allLabware.find(
          lw => lw.slot === moduleOnDeck.id
        )
        return (
          <React.Fragment key={moduleOnDeck.id}>
            <Module
              key={moduleOnDeck.slot}
              x={slotPosition[0]}
              y={slotPosition[1]}
              def={moduleDef}
              orientation={inferModuleOrientationFromXCoordinate(
                slotPosition[0]
              )}
              innerProps={
                moduleOnDeck.moduleState.type === THERMOCYCLER_MODULE_TYPE
                  ? { lidMotorState: 'open' }
                  : {}
              }
              targetSlotId={slotId}
              targetDeckId={deckDef.otId}
            >
              {labwareLoadedOnModule != null ? (
                <>
                  <LabwareOnDeck
                    x={0}
                    y={0}
                    labwareOnDeck={labwareLoadedOnModule}
                  />
                  <SlotHover
                    robotType={robotType}
                    hover={hover}
                    setHover={setHover}
                    slotPosition={[0, 0, 0]}
                    slotId={slotId}
                  />
                </>
              ) : null}
              {labwareLoadedOnModule == null ? (
                <SlotHover
                  robotType={robotType}
                  hover={hover}
                  setHover={setHover}
                  slotPosition={[0, 0, 0]}
                  slotId={slotId}
                />
              ) : null}
            </Module>
          </React.Fragment>
        )
      })}
      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          labware.slot === 'offDeck' ||
          allModules.some(m => m.id === labware.slot) ||
          allLabware.some(lab => lab.id === labware.slot)
        )
          return null

        const slotPosition = getPositionFromSlotId(labware.slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          labware.slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <SlotHover
              robotType={robotType}
              hover={hover}
              setHover={setHover}
              slotPosition={slotPosition}
              slotId={labware.slot}
            />
          </React.Fragment>
        )
      })}

      {/* all nested labwares on deck  */}
      {allLabware.map(labware => {
        if (
          allModules.some(m => m.id === labware.slot) ||
          labware.slot === 'offDeck'
        )
          return null
        if (
          deckDef.locations.addressableAreas.some(
            addressableArea => addressableArea.id === labware.slot
          )
        ) {
          return null
        }
        const slotForOnTheDeck = allLabware.find(lab => lab.id === labware.slot)
          ?.slot
        const slotForOnMod = allModules.find(mod => mod.id === slotForOnTheDeck)
          ?.slot
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        const slotOnDeck =
          slotForOnTheDeck != null
            ? allModules.find(module => module.id === slotForOnTheDeck)?.slot
            : null
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <SlotHover
              robotType={robotType}
              hover={hover}
              setHover={setHover}
              slotPosition={slotPosition}
              slotId={slotOnDeck ?? ''}
            />
          </React.Fragment>
        )
      })}

      {/* SlotControls for all empty deck */}
      {deckDef.locations.addressableAreas
        .filter(addressableArea => {
          const stagingAreaAddressableAreas = getStagingAreaAddressableAreas(
            stagingAreaCutoutIds
          )
          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
          return (
            addressableAreas &&
            !slotIdsBlockedBySpanning.includes(addressableArea.id)
          )
        })
        .map(addressableArea => {
          return (
            <React.Fragment key={addressableArea.id}>
              <SlotHover
                robotType={robotType}
                hover={hover}
                setHover={setHover}
                slotPosition={getPositionFromSlotId(
                  addressableArea.id,
                  deckDef
                )}
                slotId={addressableArea.id}
              />
            </React.Fragment>
          )
        })}
    </>
  )
}