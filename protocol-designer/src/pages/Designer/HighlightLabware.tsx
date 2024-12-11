import { useSelector } from 'react-redux'
import { getLabwareEntities } from '../../step-forms/selectors'
import { getHoveredStepLabware } from '../../ui/steps'
import { LabwareLabel } from './LabwareLabel'
import type { CoordinateTuple } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../step-forms'
import {
  getHoveredSelection,
  getSelectedSelection,
} from '../../ui/steps/selectors'

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
  const hoveredLabwareOnSelection = useSelector(getHoveredSelection)
  const selectedLabwareSelection = useSelector(getSelectedSelection)
  const adapterId =
    labwareEntities[labwareOnDeck.slot] != null
      ? labwareEntities[labwareOnDeck.slot].id
      : null
  const isLabwareSelectionSelected =
    selectedLabwareSelection.find(
      selected => selected.id === labwareOnDeck.id
    ) != null

  const selected =
    isLabwareSelectionSelected ??
    hoveredLabware.includes(adapterId ?? labwareOnDeck.id)
  const highlighted = hoveredLabwareOnSelection.id === labwareOnDeck.id

  if (highlighted || selected) {
    return (
      <LabwareLabel
        isSelected={selected}
        isLast={true}
        position={position}
        labwareDef={labwareOnDeck.def}
      />
    )
  }
  return null
}
