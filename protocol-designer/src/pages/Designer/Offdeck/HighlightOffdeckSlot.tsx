import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { DeckLabelSet } from '@opentrons/components'
import {
  getHoveredSelection,
  getSelectedSelection,
} from '../../../ui/steps/selectors'
import type { CoordinateTuple } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

interface HighlightOffdeckSlotProps {
  labwareOnDeck: LabwareOnDeck
  position: CoordinateTuple
}

export function HighlightOffdeckSlot(
  props: HighlightOffdeckSlotProps
): JSX.Element | null {
  const { labwareOnDeck, position } = props
  const { t } = useTranslation('application')
  const hoveredLabwareOnSelection = useSelector(getHoveredSelection)
  const selectedLabwareSelection = useSelector(getSelectedSelection)
  const isLabwareSelectionSelected = selectedLabwareSelection.some(
    selected => selected.id === labwareOnDeck.id
  )
  const selected = isLabwareSelectionSelected
  const highlighted = hoveredLabwareOnSelection.id === labwareOnDeck.id

  if (highlighted ?? selected) {
    return (
      <DeckLabelSet
        deckLabels={[
          {
            text: selected ? t('selected') : t('select'),
            isSelected: selected,
            isLast: true,
            isZoomed: false,
          },
        ]}
        x={position[0] - labwareOnDeck.def.cornerOffsetFromSlot.x}
        y={position[1] + labwareOnDeck.def.cornerOffsetFromSlot.y}
        width={153}
        height={102}
        invert={true}
      />
    )
  }
  return null
}
