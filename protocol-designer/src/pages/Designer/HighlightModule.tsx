import { useSelector } from 'react-redux'
import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
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
  const hoveredModulSelection = useSelector(getHoveredDropdownItem)
  const selectedDropdownModule = useSelector(getSelectedDropdownItem)
  const isSelectedModuleSelected =
    selectedDropdownModule.find(selected => selected.id === moduleId) != null
  const highlighted = hoveredModulSelection.id === moduleId

  let labelText
  if (hoveredModulSelection != null && !isSelectedModuleSelected) {
    labelText = hoveredModulSelection.text ?? undefined
  } else if (isSelectedModuleSelected) {
    labelText = selectedDropdownModule[0].text ?? undefined
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
