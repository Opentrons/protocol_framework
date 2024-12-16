import { useSelector } from 'react-redux'
import { getLabwareEntities } from '../../step-forms/selectors'
import { getHoveredStepLabware } from '../../ui/steps'
import {
  getHoveredSelection,
  getSelectedSelection,
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
  const hoveredLabwareOnSelection = useSelector(getHoveredSelection)
  const selectedLabwareSelection = useSelector(getSelectedSelection)
  const adapterId =
    labwareEntities[labwareOnDeck.slot] != null
      ? labwareEntities[labwareOnDeck.slot].id
      : null
  const isLabwareSelectionSelected = selectedLabwareSelection.some(
    selected => selected.id === labwareOnDeck.id
  )

  const selected =
    isLabwareSelectionSelected ??
    hoveredLabware.includes(adapterId ?? labwareOnDeck.id)
  const highlighted = hoveredLabwareOnSelection.id === labwareOnDeck.id

  let labelText
  if (hoveredLabwareOnSelection != null && !isLabwareSelectionSelected) {
    labelText = hoveredLabwareOnSelection.text ?? undefined
  } else if (isLabwareSelectionSelected) {
    labelText = selectedLabwareSelection[0].text ?? undefined
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
