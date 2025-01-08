import { TerseOffsetTable } from '/app/organisms/TerseOffsetTable'
import { OffsetTable } from './OffsetTable'

import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type {
  LPCStepProps,
  ResultsSummaryStep,
} from '/app/organisms/LabwarePositionCheck/types'

interface TableComponent extends LPCStepProps<ResultsSummaryStep> {
  offsetsToApply: LabwareOffsetCreateData[]
}

export function TableComponent(props: TableComponent): JSX.Element {
  const { isOnDevice, labwareDefs, offsetsToApply } = props

  return isOnDevice ? (
    <TerseOffsetTable
      offsets={offsetsToApply}
      labwareDefinitions={labwareDefs}
    />
  ) : (
    <OffsetTable
      offsets={offsetsToApply}
      labwareDefinitions={labwareDefs}
      {...props}
    />
  )
}
