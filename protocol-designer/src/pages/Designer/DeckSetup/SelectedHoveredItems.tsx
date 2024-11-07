import { useSelector } from 'react-redux'
import { LabwareRender, Module } from '@opentrons/components'
import {
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { selectors } from '../../../labware-ingred/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { LabwareOnDeck } from '../../../components/DeckSetup/LabwareOnDeck'
import { ModuleLabel } from './ModuleLabel'
import { LabwareLabel } from '../LabwareLabel'
import { FixtureRender } from './FixtureRender'
import type {
  CoordinateTuple,
  DeckDefinition,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { DeckLabelProps } from '@opentrons/components'
import type { Fixture } from './constants'

interface SelectedHoveredItemsProps {
  deckDef: DeckDefinition
  robotType: RobotType
  hoveredLabware: string | null
  hoveredModule: ModuleModel | null
  hoveredFixture: Fixture | null
  slotPosition: CoordinateTuple | null
}
export const SelectedHoveredItems = (
  props: SelectedHoveredItemsProps
): JSX.Element => {
  const {
    deckDef,
    robotType,
    hoveredFixture,
    hoveredModule,
    hoveredLabware,
    slotPosition,
  } = props
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const {
    selectedSlot,
    selectedFixture,
    selectedLabwareDefUri,
    selectedModuleModel,
    selectedNestedLabwareDefUri,
  } = selectedSlotInfo
  const customLabwareDefs = useSelector(getCustomLabwareDefsByURI)
  const defs = getOnlyLatestDefs()
  const deckSetup = useSelector(getInitialDeckSetup)
  const { labware, modules } = deckSetup
  const matchingSelectedLabwareOnDeck = Object.values(labware).find(labware => {
    const moduleUnderLabware = Object.values(modules).find(
      mod => mod.id === labware.slot
    )
    const matchingSlot =
      moduleUnderLabware != null ? moduleUnderLabware.slot : labware.slot
    return (
      matchingSlot === selectedSlot.slot &&
      labware.labwareDefURI === selectedLabwareDefUri
    )
  })
  const matchingSelectedNestedLabwareOnDeck = Object.values(labware).find(
    lw => {
      const adapterUnderLabware = Object.values(labware).find(
        lab => lab.id === lw.slot
      )
      if (adapterUnderLabware == null) {
        return
      }
      const moduleUnderLabware = Object.values(modules).find(
        mod => mod.id === adapterUnderLabware.slot
      )
      const matchingSlot =
        moduleUnderLabware != null
          ? moduleUnderLabware.slot
          : adapterUnderLabware.slot
      return (
        lw.labwareDefURI === selectedNestedLabwareDefUri &&
        matchingSlot === selectedSlot.slot
      )
    }
  )
  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null

  const orientation =
    slotPosition != null
      ? inferModuleOrientationFromXCoordinate(slotPosition[0])
      : null

  const labwareInfos: DeckLabelProps[] = []

  if (
    selectedLabwareDefUri != null &&
    (hoveredLabware == null || hoveredLabware !== selectedLabwareDefUri)
  ) {
    const def =
      defs[selectedLabwareDefUri] ?? customLabwareDefs[selectedLabwareDefUri]
    const selectedLabwareLabel = {
      text: def.metadata.displayName,
      isSelected: true,
      isLast: hoveredLabware == null && selectedNestedLabwareDefUri == null,
    }
    labwareInfos.push(selectedLabwareLabel)
  }
  if (matchingSelectedNestedLabwareOnDeck != null && hoveredLabware == null) {
    const selectedNestedLabwareLabel = {
      text: matchingSelectedNestedLabwareOnDeck.def.metadata.displayName,
      isSelected: true,
      isLast: hoveredLabware == null,
    }
    labwareInfos.push(selectedNestedLabwareLabel)
  }
  if (
    (hoveredLabware != null ||
      selectedLabwareDefUri === hoveredLabware ||
      selectedNestedLabwareDefUri === hoveredLabware) &&
    hoveredLabwareDef != null
  ) {
    const hoverLabelLabel = {
      text: hoveredLabwareDef.metadata.displayName,
      isSelected: false,
      isLast: true,
    }
    labwareInfos.push(hoverLabelLabel)
  }

  return (
    <>
      {selectedFixture != null &&
      selectedSlot.cutout != null &&
      hoveredFixture == null &&
      hoveredModule == null ? (
        <FixtureRender
          fixture={selectedFixture}
          cutout={selectedSlot.cutout}
          robotType={robotType}
          deckDef={deckDef}
        />
      ) : null}
      {selectedModuleModel != null &&
      slotPosition != null &&
      hoveredModule == null &&
      hoveredFixture == null &&
      orientation != null ? (
        <>
          <Module
            key={`${selectedModuleModel}_${selectedSlot.slot}_selected`}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={getModuleDef2(selectedModuleModel)}
            orientation={orientation}
          >
            <>
              {matchingSelectedLabwareOnDeck != null &&
              selectedModuleModel != null &&
              hoveredLabware == null ? (
                <LabwareOnDeck
                  labwareOnDeck={matchingSelectedLabwareOnDeck}
                  x={0}
                  y={0}
                />
              ) : null}
              {matchingSelectedNestedLabwareOnDeck != null &&
              selectedModuleModel != null &&
              hoveredLabware == null ? (
                <LabwareOnDeck
                  labwareOnDeck={matchingSelectedNestedLabwareOnDeck}
                  x={0}
                  y={0}
                />
              ) : null}
              {hoveredLabwareDef != null && selectedModuleModel != null ? (
                <g transform={`translate(0, 0)`}>
                  <LabwareRender definition={hoveredLabwareDef} />
                </g>
              ) : null}
            </>
          </Module>
          {selectedModuleModel != null ? (
            <ModuleLabel
              isLast={hoveredLabware == null && selectedLabwareDefUri == null}
              moduleModel={selectedModuleModel}
              position={slotPosition}
              orientation={orientation}
              isSelected={true}
              labwareInfos={labwareInfos}
            />
          ) : null}
        </>
      ) : null}
      {matchingSelectedLabwareOnDeck != null &&
      slotPosition != null &&
      selectedModuleModel == null &&
      hoveredLabware == null ? (
        <>
          <LabwareOnDeck
            x={slotPosition[0]}
            y={slotPosition[1]}
            labwareOnDeck={matchingSelectedLabwareOnDeck}
          />
          {selectedNestedLabwareDefUri == null ? (
            <LabwareLabel
              isLast={true}
              isSelected={true}
              labwareDef={matchingSelectedLabwareOnDeck.def}
              position={slotPosition}
            />
          ) : null}
        </>
      ) : null}
      {matchingSelectedNestedLabwareOnDeck != null &&
      slotPosition != null &&
      selectedModuleModel == null &&
      hoveredLabware == null ? (
        <>
          <LabwareOnDeck
            x={slotPosition[0]}
            y={slotPosition[1]}
            labwareOnDeck={matchingSelectedNestedLabwareOnDeck}
          />
          {matchingSelectedLabwareOnDeck != null ? (
            <LabwareLabel
              isLast={false}
              isSelected={true}
              labwareDef={matchingSelectedLabwareOnDeck.def}
              position={slotPosition}
              nestedLabwareInfo={[
                {
                  text:
                    matchingSelectedNestedLabwareOnDeck.def.metadata
                      .displayName,
                  isSelected: true,
                  isLast: true,
                },
              ]}
            />
          ) : null}
        </>
      ) : null}
    </>
  )
}
