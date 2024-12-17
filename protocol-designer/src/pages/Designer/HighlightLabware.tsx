import { useSelector } from 'react-redux'
import { getLabwareEntities } from '../../step-forms/selectors'
import { getHoveredStepLabware } from '../../ui/steps'
import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
} from '../../ui/steps/selectors'
import { LabwareLabel } from './LabwareLabel'
import type { CoordinateTuple } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../step-forms'

interface HighlightLabwareProps {
  labwareOnDeck: LabwareOnDeck
  position: CoordinateTuple
}

export function HighlightLabware(
  props: HighlightLabwareProps
): JSX.Element | null {
  const { labwareOnDeck, position } = props
  const labwareEntities = useSelector(getLabwareEntities)
  const hoveredLabware = useSelector(getHoveredStepLabware)
  const hoveredDropdownLabware = useSelector(getHoveredDropdownItem)
  const selectedDropdownLabware = useSelector(getSelectedDropdownItem)
  const adapterId =
    labwareEntities[labwareOnDeck.slot] != null
      ? labwareEntities[labwareOnDeck.slot].id
      : null
  const labwareSelectionSelected = selectedDropdownLabware.find(
    selected => selected.id === labwareOnDeck.id
  )
  const isLabwareSelected = labwareSelectionSelected != null
  const selected =
    isLabwareSelected ?? hoveredLabware.includes(adapterId ?? labwareOnDeck.id)
  const highlighted = hoveredDropdownLabware.id === labwareOnDeck.id

  let labelText
  if (hoveredDropdownLabware != null && labwareSelectionSelected == null) {
    labelText = hoveredDropdownLabware.text ?? undefined
  } else if (labwareSelectionSelected != null) {
    labelText = labwareSelectionSelected.text ?? undefined
  }

  if (highlighted || selected) {
    return (
      <LabwareLabel
        isSelected={selected}
        isLast={true}
        position={position}
        labwareDef={labwareOnDeck.def}
        labelText={labelText}
      />
    )
  }
  return null
}
