import { useSelector } from 'react-redux'
import {
  getHoveredSelection,
  getSelectedSelection,
} from '../../ui/steps/selectors'
import { ModuleLabel } from './DeckSetup/ModuleLabel'

import type { CoordinateTuple, ModuleModel } from '@opentrons/shared-data'

interface HighlightModuleProps {
  moduleModel: ModuleModel
  position: CoordinateTuple
  orientation: 'left' | 'right'
  moduleId: string
}
export const HighlightModule = (
  props: HighlightModuleProps
): JSX.Element | null => {
  const { moduleModel, position, orientation, moduleId } = props
  const hoveredModulSelection = useSelector(getHoveredSelection)
  const selectedModuleSelection = useSelector(getSelectedSelection)
  const isSelectedModuleSelected =
    selectedModuleSelection.find(selected => selected.id === moduleId) != null
  const highlighted = hoveredModulSelection.id === moduleId

  let labelText
  if (hoveredModulSelection != null && !isSelectedModuleSelected) {
    labelText = hoveredModulSelection.text ?? undefined
  } else if (isSelectedModuleSelected) {
    labelText = selectedModuleSelection[0].text ?? undefined
  }

  if (isSelectedModuleSelected || highlighted) {
    return (
      <ModuleLabel
        isLast={true}
        isSelected={isSelectedModuleSelected}
        moduleModel={moduleModel}
        position={position}
        orientation={orientation}
        isZoomed={false}
        labelName={labelText}
      />
    )
  }
  return null
}
