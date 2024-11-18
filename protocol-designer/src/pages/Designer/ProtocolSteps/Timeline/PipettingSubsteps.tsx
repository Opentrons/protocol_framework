import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import { Substep } from './Substep'
import { MultichannelSubstep } from './MultichannelSubstep'
import type {
  SourceDestSubstepItem,
  SubstepIdentifier,
  WellIngredientNames,
} from '../../../../steplist'
import { useSelector } from 'react-redux'
import {
  getAdditionalEquipment,
  getSavedStepForms,
} from '../../../../step-forms/selectors'

interface PipettingSubstepsProps {
  substeps: SourceDestSubstepItem
  ingredNames: WellIngredientNames
  selectSubstep: (substepIdentifier: SubstepIdentifier) => void
  hoveredSubstep?: SubstepIdentifier | null
}

export function PipettingSubsteps(props: PipettingSubstepsProps): JSX.Element {
  const { substeps, selectSubstep, hoveredSubstep, ingredNames } = props
  const stepId = substeps.parentStepId
  const formData = useSelector(getSavedStepForms)[stepId]
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const destLocationId = formData.dispense_labware
  const trashName =
    additionalEquipment[destLocationId] != null
      ? additionalEquipment[destLocationId]?.name
      : null

  const isSameLabware = formData.aspirate_labware === formData.dispense_labware

  const renderSubsteps = substeps.multichannel
    ? substeps.multiRows.map((rowGroup, groupKey) => {
        const filteredRowGroup = rowGroup.filter(
          item => item.source !== undefined
        )
        if (filteredRowGroup.length === 0) return null

        return (
          <MultichannelSubstep
            trashName={trashName}
            key={groupKey}
            highlighted={
              !!hoveredSubstep &&
              hoveredSubstep.stepId === substeps.parentStepId &&
              hoveredSubstep.substepIndex === groupKey
            }
            rowGroup={filteredRowGroup}
            stepId={substeps.parentStepId}
            substepIndex={groupKey}
            selectSubstep={selectSubstep}
            ingredNames={ingredNames}
          />
        )
      })
    : substeps.rows.map(
        (row, substepIndex) => (
          console.log(row.volume),
          (
            <Substep
              trashName={trashName}
              key={substepIndex}
              selectSubstep={selectSubstep}
              stepId={substeps.parentStepId}
              substepIndex={substepIndex}
              ingredNames={ingredNames}
              volume={row.volume}
              source={row.source}
              dest={row.dest}
              isSameLabware={isSameLabware}
            />
          )
        )
      )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      width="100%"
    >
      {renderSubsteps}
    </Flex>
  )
}
