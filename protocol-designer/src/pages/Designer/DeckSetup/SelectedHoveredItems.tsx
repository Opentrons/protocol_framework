import { useSelector } from 'react-redux'
import { FixtureRender } from './FixtureRender'
import { LabwareRender, Module } from '@opentrons/components'
import {
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { selectors } from '../../../labware-ingred/selectors'
import { getOnlyLatestDefs } from '../../../labware-defs'
import { getCustomLabwareDefsByURI } from '../../../labware-defs/selectors'
import { ModuleLabel } from './ModuleLabel'
import { LabwareLabel } from '../LabwareLabel'
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

  const hoveredLabwareDef =
    hoveredLabware != null
      ? defs[hoveredLabware] ?? customLabwareDefs[hoveredLabware] ?? null
      : null
  const selectedLabwareDef =
    selectedLabwareDefUri != null
      ? defs[selectedLabwareDefUri] ?? customLabwareDefs[selectedLabwareDefUri]
      : null
  const selectedNestedLabwareDef =
    selectedNestedLabwareDefUri != null
      ? defs[selectedNestedLabwareDefUri] ??
        customLabwareDefs[selectedNestedLabwareDefUri]
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
  if (selectedNestedLabwareDef != null && hoveredLabware == null) {
    const selectedNestedLabwareLabel = {
      text: selectedNestedLabwareDef.metadata.displayName,
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
              {selectedLabwareDef != null &&
              selectedModuleModel != null &&
              hoveredLabware == null ? (
                <g transform={`translate(0, 0)`}>
                  <LabwareRender definition={selectedLabwareDef} />
                </g>
              ) : null}
              {selectedNestedLabwareDef != null &&
              selectedModuleModel != null &&
              hoveredLabware == null ? (
                <g transform={`translate(0, 0)`}>
                  <LabwareRender definition={selectedNestedLabwareDef} />
                </g>
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
      {selectedLabwareDef != null &&
      slotPosition != null &&
      selectedModuleModel == null &&
      hoveredLabware == null ? (
        <>
          <g transform={`translate(${slotPosition[0]}, ${slotPosition[1]})`}>
            <LabwareRender definition={selectedLabwareDef} />
          </g>
          {selectedNestedLabwareDefUri == null ? (
            <LabwareLabel
              isLast={true}
              isSelected={true}
              labwareDef={selectedLabwareDef}
              position={slotPosition}
            />
          ) : null}
        </>
      ) : null}
      {selectedNestedLabwareDef != null &&
      slotPosition != null &&
      selectedModuleModel == null &&
      hoveredLabware == null ? (
        <>
          <g transform={`translate(${slotPosition[0]}, ${slotPosition[1]})`}>
            <LabwareRender definition={selectedNestedLabwareDef} />
          </g>
          {selectedLabwareDef != null ? (
            <LabwareLabel
              isLast={false}
              isSelected={true}
              labwareDef={selectedLabwareDef}
              position={slotPosition}
              nestedLabwareInfo={[
                {
                  text: selectedNestedLabwareDef.metadata.displayName,
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
