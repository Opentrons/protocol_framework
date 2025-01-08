import { TerseOffsetTable } from '/app/organisms/TerseOffsetTable'
import { OffsetTable } from './OffsetTable'

import type { LabwareOffsetCreateData } from '@opentrons/api-client'
import type {
  LPCStepProps,
  ResultsSummaryStep,
} from '/app/organisms/LabwarePositionCheck/types'

interface TableComponentProps extends LPCStepProps<ResultsSummaryStep> {
  offsetsToApply: LabwareOffsetCreateData[]
}

export function TableComponent(props: TableComponentProps): JSX.Element {
  const { state, offsetsToApply } = props
  const { isOnDevice, labwareDefs } = state

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
